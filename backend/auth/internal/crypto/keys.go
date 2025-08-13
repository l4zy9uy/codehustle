package crypto

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"codehustle/backend/auth/internal/config"
)

type KeySet struct {
	ActiveKID string
	Priv      *rsa.PrivateKey
	Pub       *rsa.PublicKey
}

var (
	keysMu sync.RWMutex
	keyset *KeySet
)

func LoadKeys() error {
	keysMu.Lock()
	defer keysMu.Unlock()

	kid := config.Get("ACTIVE_KID")
	dir := config.Get("KEY_DIR")
	if kid == "" || dir == "" {
		return errors.New("ACTIVE_KID or KEY_DIR is empty")
	}

	privPath := filepath.Join(dir, fmt.Sprintf("%s.pem", kid))
	pubPath := filepath.Join(dir, fmt.Sprintf("%s.pub", kid))

	privBytes, err := os.ReadFile(privPath)
	if err != nil {
		return fmt.Errorf("read priv: %w", err)
	}
	pubBytes, err := os.ReadFile(pubPath)
	if err != nil {
		return fmt.Errorf("read pub: %w", err)
	}

	privKey, err := parseRSAPrivateKey(privBytes)
	if err != nil {
		return fmt.Errorf("parse priv: %w", err)
	}
	pubKey, err := parseRSAPublicKey(pubBytes)
	if err != nil {
		return fmt.Errorf("parse pub: %w", err)
	}

	keyset = &KeySet{ActiveKID: kid, Priv: privKey, Pub: pubKey}
	return nil
}

func Current() (*KeySet, error) {
	keysMu.RLock()
	defer keysMu.RUnlock()
	if keyset == nil {
		return nil, errors.New("keys not loaded")
	}
	return keyset, nil
}

func parseRSAPrivateKey(pemBytes []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, errors.New("no pem block for priv")
	}
	switch block.Type {
	case "RSA PRIVATE KEY":
		return x509.ParsePKCS1PrivateKey(block.Bytes)
	case "PRIVATE KEY":
		k, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return nil, err
		}
		rk, ok := k.(*rsa.PrivateKey)
		if !ok {
			return nil, errors.New("not RSA private key")
		}
		return rk, nil
	default:
		return nil, fmt.Errorf("unsupported priv type: %s", block.Type)
	}
}

func parseRSAPublicKey(pemBytes []byte) (*rsa.PublicKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, errors.New("no pem block for pub")
	}
	switch block.Type {
	case "PUBLIC KEY":
		k, err := x509.ParsePKIXPublicKey(block.Bytes)
		if err != nil {
			return nil, err
		}
		rk, ok := k.(*rsa.PublicKey)
		if !ok {
			return nil, errors.New("not RSA public key")
		}
		return rk, nil
	case "RSA PUBLIC KEY":
		return x509.ParsePKCS1PublicKey(block.Bytes)
	default:
		return nil, fmt.Errorf("unsupported pub type: %s", block.Type)
	}
}
