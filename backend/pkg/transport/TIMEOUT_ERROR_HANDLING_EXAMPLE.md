# Timeout Error Handling Example

This document shows how to use the enhanced timeout error handling in the REST transport package.

## Features Added

1. **Custom Error Types**: Specific error types for timeout, connection, DNS, and general request errors
2. **Enhanced Error Detection**: Comprehensive timeout detection including context deadlines, net.Error timeouts, and pattern matching
3. **Utility Functions**: Easy-to-use functions to check error types
4. **Detailed Error Information**: Get comprehensive error details with context

## Usage Examples

### Basic Timeout Detection

```go
package main

import (
    "britaxs_api/pkg/transport"
    "fmt"
    "time"
)

func main() {
    // Create a client with 5 second timeout
    client := transport.NewRestClient("https://api.example.com", 5*time.Second)
    
    // Make a request that might timeout
    _, statusCode, _, err := client.Get("/slow-endpoint", nil)
    
    if err != nil {
        // Check if it's a timeout error using utility function
        if transport.IsTimeoutError(err) {
            fmt.Println("Request timed out!")
            
            // Get detailed error information
            details := transport.GetErrorDetails(err)
            fmt.Printf("Timeout details: %+v\n", details)
            
            // Handle timeout specifically
            handleTimeoutError(err)
        } else if transport.IsConnectionError(err) {
            fmt.Println("Connection error occurred!")
            handleConnectionError(err)
        } else if transport.IsDNSError(err) {
            fmt.Println("DNS resolution error occurred!")
            handleDNSError(err)
        } else {
            fmt.Printf("Other error: %v\n", err)
        }
        return
    }
    
    fmt.Printf("Request successful with status: %d\n", statusCode)
}

func handleTimeoutError(err error) {
    // Cast to TimeoutError for more details
    if timeoutErr, ok := err.(*transport.TimeoutError); ok {
        fmt.Printf("Timeout after %v on URL: %s\n", 
            timeoutErr.Timeout, timeoutErr.URL)
        
        // Implement retry logic, circuit breaker, etc.
        // Example: exponential backoff retry
    }
}

func handleConnectionError(err error) {
    // Handle connection refused, network unreachable, etc.
    if connErr, ok := err.(*transport.ConnectionError); ok {
        fmt.Printf("Connection failed to: %s\n", connErr.URL)
        
        // Implement fallback to secondary endpoints
        // Log for monitoring/alerting
    }
}

func handleDNSError(err error) {
    // Handle DNS resolution failures
    if dnsErr, ok := err.(*transport.DNSError); ok {
        fmt.Printf("DNS resolution failed for: %s\n", dnsErr.URL)
        
        // Implement DNS fallback, caching, etc.
    }
}
```

### Using with Database Logging

```go
func makeRequestWithErrorHandling(client *transport.RestClient, db *gorm.DB) {
    opts := &transport.RequestOptions{
        Body: map[string]interface{}{
            "data": "example",
        },
        Headers: map[string]string{
            "Content-Type": "application/json",
        },
    }
    
    // Make request with logging enabled
    response, statusCode, _, err := client.PostWithLogging(
        "/api/endpoint", 
        opts, 
        db, 
        true, // isESB = true
    )
    
    if err != nil {
        // Enhanced error handling with logging
        if transport.IsTimeoutError(err) {
            // Timeout errors are automatically logged with enhanced context
            fmt.Printf("Request timed out: %v\n", err)
            
            // Get timeout duration from error
            if timeoutErr, ok := err.(*transport.TimeoutError); ok {
                fmt.Printf("Timeout occurred after: %v\n", timeoutErr.Timeout)
            }
            
            return
        }
        
        // Handle other error types...
        fmt.Printf("Request failed: %v\n", err)
        return
    }
    
    fmt.Printf("Success: %s (Status: %d)\n", string(response), statusCode)
}
```

### Custom Context with Timeout

```go
func makeRequestWithCustomTimeout(client *transport.RestClient) {
    // Create custom context with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    opts := &transport.RequestOptions{
        Context: ctx,
        Body: map[string]string{
            "key": "value",
        },
    }
    
    _, _, _, err := client.Post("/api/data", opts)
    
    if err != nil {
        if transport.IsTimeoutError(err) {
            fmt.Println("Custom timeout exceeded!")
            
            // Check if it was context deadline exceeded
            if errors.Is(err, context.DeadlineExceeded) {
                fmt.Println("Context deadline was exceeded")
            }
        }
    }
}
```

## Error Types

### TimeoutError
```go
type TimeoutError struct {
    URL     string        // The URL that timed out
    Timeout time.Duration // The timeout duration
    Err     error         // Original error
}
```

### ConnectionError
```go
type ConnectionError struct {
    URL string // The URL that failed to connect
    Err error  // Original error
}
```

### DNSError
```go
type DNSError struct {
    URL string // The URL with DNS issues
    Err error  // Original error
}
```

### RequestError
```go
type RequestError struct {
    URL string // The URL that failed
    Err error  // Original error
}
```

## Utility Functions

- `IsTimeoutError(err error) bool` - Check if error is timeout-related
- `IsConnectionError(err error) bool` - Check if error is connection-related
- `IsDNSError(err error) bool` - Check if error is DNS-related
- `GetErrorDetails(err error) map[string]interface{}` - Get comprehensive error details

## Integration with Existing Code

The enhanced error handling is backward compatible. Existing code will continue to work, but you can now add specific timeout handling:

```go
// Before
_, _, _, err := client.Get("/api/endpoint", nil)
if err != nil {
    log.Printf("Request failed: %v", err)
    return
}

// After - with enhanced timeout handling
_, _, _, err := client.Get("/api/endpoint", nil)
if err != nil {
    if transport.IsTimeoutError(err) {
        // Handle timeout specifically
        log.Printf("Request timed out: %v", err)
        // Implement retry logic, circuit breaker, etc.
    } else {
        log.Printf("Request failed: %v", err)
    }
    return
}
```