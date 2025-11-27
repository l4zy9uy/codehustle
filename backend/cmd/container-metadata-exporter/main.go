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
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	containerdSocket = flag.String("containerd-socket", "/run/containerd/containerd.sock", "Path to containerd socket")
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

	// Connect to containerd
	client, err := containerd.New(*containerdSocket)
	if err != nil {
		log.Fatalf("Failed to connect to containerd: %v", err)
	}
	defer client.Close()

	// Start background refresh
	go refreshLoop(client)

	// Start metrics server
	http.Handle("/metrics", promhttp.Handler())
	log.Printf("Starting container metadata exporter on %s", *listenAddr)
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

		// Check Docker Compose labels first (most common for docker-compose setups)
		if service, ok := info.Labels["com.docker.compose.service"]; ok {
			containerName = service
			// Optionally include project
			if project, ok := info.Labels["com.docker.compose.project"]; ok && project != "" {
				containerName = fmt.Sprintf("%s_%s", project, service)
			}
		} else if name, ok := info.Labels["io.kubernetes.container.name"]; ok {
			containerName = name
		} else if name, ok := info.Labels["io.containerd.container.name"]; ok {
			containerName = name
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
