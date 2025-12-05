package utils

import "strings"

// Contains checks if a string contains a substring
func Contains(s, substr string) bool {
	return strings.Contains(s, substr)
}

// ByteReader implements io.Reader for byte slices
type ByteReader struct {
	Data []byte
	pos  int
}

// Read implements io.Reader interface
func (r *ByteReader) Read(p []byte) (n int, err error) {
	if r.pos >= len(r.Data) {
		return 0, nil
	}
	n = copy(p, r.Data[r.pos:])
	r.pos += n
	return n, nil
}

