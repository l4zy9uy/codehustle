package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/containerd/containerd"
	"github.com/containerd/containerd/namespaces"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	containerdSocket = flag.String("containerd-socket", "/run/containerd/containerd.sock", "Path to containerd socket")
	dockerSocket     = flag.String("docker-socket", "/var/run/docker.sock", "Path to Docker socket (alternative to containerd)")
	useDocker        = flag.Bool("use-docker", false, "Use Docker API instead of containerd (better for Docker Compose labels)")
	namespace        = flag.String("namespace", "moby", "Containerd namespace (default: moby for Docker)")
	listenAddr       = flag.String("listen", ":9090", "Address to listen on for metrics")
	refreshInterval  = flag.Duration("refresh", 30*time.Second, "How often to refresh container metadata")
)

var (
	containerNameInfo = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "container_name_info",
			Help: "Container name metadata from containerd. Value is always 1, labels contain container_id and container_name",
		},
		[]string{"container_id", "container_name"},
	)
)

func init() {
	prometheus.MustRegister(containerNameInfo)
}

func main() {
	flag.Parse()

	if *useDocker {
		// Use Docker API
		dockerClient, err := client.NewClientWithOpts(client.WithHost("unix://"+*dockerSocket), client.WithAPIVersionNegotiation())
		if err != nil {
			log.Fatalf("Failed to connect to Docker: %v", err)
		}
		defer dockerClient.Close()

		go refreshLoopDocker(dockerClient)
	} else {
		// Use containerd API
		containerdClient, err := containerd.New(*containerdSocket)
		if err != nil {
			log.Fatalf("Failed to connect to containerd: %v", err)
		}
		defer containerdClient.Close()

		go refreshLoop(containerdClient)
	}

	// Start metrics server
	http.Handle("/metrics", promhttp.Handler())
	log.Printf("Starting container metadata exporter on %s (using %s)", *listenAddr, map[bool]string{true: "Docker API", false: "containerd API"}[*useDocker])
	log.Fatal(http.ListenAndServe(*listenAddr, nil))
}

func refreshLoop(client *containerd.Client) {
	ticker := time.NewTicker(*refreshInterval)
	defer ticker.Stop()

	// Initial refresh
	refresh(client)

	for range ticker.C {
		refresh(client)
	}
}

func refresh(client *containerd.Client) {
	ctx := namespaces.WithNamespace(context.Background(), *namespace)

	// List all containers
	containers, err := client.Containers(ctx)
	if err != nil {
		log.Printf("Error listing containers: %v", err)
		return
	}

	// Reset all metrics
	containerNameInfo.Reset()

	// Update metrics for each container
	for _, container := range containers {
		info, err := container.Info(ctx)
		if err != nil {
			log.Printf("Error getting container info for %s: %v", container.ID(), err)
			continue
		}

		// Get container name from labels (prioritize Docker Compose labels)
		containerName := container.ID()[:12] // fallback to short ID

		// Check container spec/annotations (Docker Compose labels are often here)
		spec, err := container.Spec(ctx)
		if err == nil && spec.Annotations != nil {
			// Debug: log first container's annotations to see what's available
			if len(containers) > 0 && container.ID() == containers[0].ID() {
				log.Printf("Sample container %s annotations: %v", container.ID()[:12], spec.Annotations)
			}

			// Check Docker Compose service name in annotations
			if service, ok := spec.Annotations["com.docker.compose.service"]; ok && service != "" {
				containerName = service
				// Optionally include project
				if project, ok := spec.Annotations["com.docker.compose.project"]; ok && project != "" {
					containerName = fmt.Sprintf("%s_%s", project, service)
				}
			} else if name, ok := spec.Annotations["io.kubernetes.container.name"]; ok && name != "" {
				containerName = name
			}
		}

		// Also check info.Labels as fallback
		if containerName == container.ID()[:12] {
			// Debug: log first container's labels
			if len(containers) > 0 && container.ID() == containers[0].ID() {
				log.Printf("Sample container %s labels: %v", container.ID()[:12], info.Labels)
			}

			if service, ok := info.Labels["com.docker.compose.service"]; ok && service != "" {
				containerName = service
				if project, ok := info.Labels["com.docker.compose.project"]; ok && project != "" {
					containerName = fmt.Sprintf("%s_%s", project, service)
				}
			} else if name, ok := info.Labels["io.kubernetes.container.name"]; ok && name != "" {
				containerName = name
			} else if name, ok := info.Labels["io.containerd.container.name"]; ok && name != "" {
				containerName = name
			}
		}

		// Get full container ID (64-character hash)
		fullID := container.ID()
		shortID := fullID
		if len(fullID) > 12 {
			shortID = fullID[:12]
		}

		// cAdvisor id format: /system.slice/docker-<full-64-char-hash>.scope
		// We need to expose the full hash for matching, not just 12 chars
		// Set metric with full ID (for cAdvisor matching - it shows full hash)
		containerNameInfo.WithLabelValues(fullID, containerName).Set(1)
		// Also set with short ID for convenience
		containerNameInfo.WithLabelValues(shortID, containerName).Set(1)
	}

	log.Printf("Refreshed container metadata: %d containers", len(containers))
}

func refreshLoopDocker(dockerClient *client.Client) {
	ticker := time.NewTicker(*refreshInterval)
	defer ticker.Stop()

	// Initial refresh
	refreshDocker(dockerClient)

	for range ticker.C {
		refreshDocker(dockerClient)
	}
}

func refreshDocker(dockerClient *client.Client) {
	ctx := context.Background()

	// List all containers
	containers, err := dockerClient.ContainerList(ctx, container.ListOptions{})
	if err != nil {
		log.Printf("Error listing Docker containers: %v", err)
		return
	}

	// Reset all metrics
	containerNameInfo.Reset()

	// Update metrics for each container
	for _, container := range containers {
		// Get detailed container info (includes labels)
		containerJSON, err := dockerClient.ContainerInspect(ctx, container.ID)
		if err != nil {
			log.Printf("Error inspecting container %s: %v", container.ID[:12], err)
			continue
		}

		// Get container name from Docker Compose labels
		containerName := containerJSON.Name
		if containerName != "" && len(containerName) > 1 {
			// Remove leading slash from Docker name
			containerName = containerName[1:]
		}

		// Prefer Docker Compose service name if available
		if service, ok := containerJSON.Config.Labels["com.docker.compose.service"]; ok && service != "" {
			containerName = service
			// Optionally include project
			if project, ok := containerJSON.Config.Labels["com.docker.compose.project"]; ok && project != "" {
				containerName = fmt.Sprintf("%s_%s", project, service)
			}
		}

		// Get full container ID (64-character hash)
		fullID := containerJSON.ID
		shortID := fullID
		if len(fullID) > 12 {
			shortID = fullID[:12]
		}

		// Set metric with full ID (for cAdvisor matching - it shows full hash)
		containerNameInfo.WithLabelValues(fullID, containerName).Set(1)
		// Also set with short ID for convenience
		containerNameInfo.WithLabelValues(shortID, containerName).Set(1)
	}

	log.Printf("Refreshed container metadata from Docker: %d containers", len(containers))
}
