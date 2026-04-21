package janitor

import (
	"container/list"
	"hash/fnv"
	"runtime"
	"sync"
	"time"
)

// cacheItem is an object stored in the cache.
// It includes a key so we know what to delete from the map when evicting.
type cacheItem struct {
	key        string
	value      any
	sizeBytes  int64
	expiration int64
}

// cacheShard is a single shard of the cache. It has its own lock,
// map, and LRU list to allow for concurrent operations.
type cacheShard struct {
	mu          sync.Mutex // Mutex is used instead of RWMutex because Get also modifies the list.
	items       map[string]*list.Element
	evictList   *list.List
	currentSize int64
	maxSize     int64
}

// Cache is a thread-safe, sharded, in-memory LRU cache.
type Cache struct {
	shards            []*cacheShard
	numShards         uint64
	janitor           *janitor
	defaultExpiration time.Duration
}

// NewCache creates a new sharded LRU cache.
// - maxSizeBytes: The total maximum size of the cache across all shards.
// - numShards: The number of shards to create. Must be > 0. A power of 2 is recommended.
// - defaultExpiration, cleanupInterval: For managing TTL and cleanup.
func NewCache(maxSizeBytes int64, numShards int, defaultExpiration, cleanupInterval time.Duration) *Cache {
	if numShards <= 0 {
		numShards = 64 // Default to 64 shards if input is invalid
	}

	c := &Cache{
		shards:            make([]*cacheShard, numShards),
		numShards:         uint64(numShards),
		defaultExpiration: defaultExpiration,
	}

	shardMaxSize := maxSizeBytes / int64(numShards)
	for i := 0; i < numShards; i++ {
		c.shards[i] = &cacheShard{
			items:     make(map[string]*list.Element),
			evictList: list.New(),
			maxSize:   shardMaxSize,
		}
	}

	// Start the janitor for cleaning up expired items
	if cleanupInterval > 0 {
		j := &janitor{Interval: cleanupInterval, stop: make(chan struct{})}
		c.janitor = j
		go j.run(c)
		runtime.SetFinalizer(c, stopJanitor)
	}

	return c
}

// getShard returns the appropriate shard for a given key.
func (c *Cache) getShard(key string) *cacheShard {
	hasher := fnv.New64a()
	hasher.Write([]byte(key))
	// Use bitwise AND for faster modulo if numShards is a power of 2
	return c.shards[hasher.Sum64()&(c.numShards-1)]
}

// Set adds an item to the cache.
func (c *Cache) Set(key string, value any, sizeBytes int64, ttl time.Duration) {
	shard := c.getShard(key)
	shard.mu.Lock()
	defer shard.mu.Unlock()

	var expiration int64
	if ttl == DefaultExpiration {
		ttl = c.defaultExpiration
	}
	if ttl > 0 {
		expiration = time.Now().Add(ttl).UnixNano()
	}

	// Check if item already exists
	if elem, ok := shard.items[key]; ok {
		// Update existing item
		item := elem.Value.(*cacheItem)
		shard.currentSize += (sizeBytes - item.sizeBytes)
		item.value = value
		item.sizeBytes = sizeBytes
		item.expiration = expiration
		shard.evictList.MoveToFront(elem)
	} else {
		// Add new item
		item := &cacheItem{key, value, sizeBytes, expiration}
		elem := shard.evictList.PushFront(item)
		shard.items[key] = elem
		shard.currentSize += sizeBytes
	}

	// Evict if necessary
	for shard.maxSize > 0 && shard.currentSize > shard.maxSize {
		shard.removeOldest()
	}
}

// Get retrieves an item from the cache.
func (c *Cache) Get(key string) (any, bool) {
	shard := c.getShard(key)
	shard.mu.Lock()
	defer shard.mu.Unlock()

	elem, ok := shard.items[key]
	if !ok {
		return nil, false
	}

	item := elem.Value.(*cacheItem)

	// Check for expiration
	if item.expiration > 0 && time.Now().UnixNano() > item.expiration {
		shard.removeElement(elem)
		return nil, false
	}

	// Item is not expired, move it to the front of the LRU list
	shard.evictList.MoveToFront(elem)
	return item.value, true
}

// Delete removes an item from the cache.
func (c *Cache) Delete(key string) {
	shard := c.getShard(key)
	shard.mu.Lock()
	defer shard.mu.Unlock()

	if elem, ok := shard.items[key]; ok {
		shard.removeElement(elem)
	}
}

// removeOldest removes the least recently used item from a shard.
// MUST be called with the shard lock held.
func (s *cacheShard) removeOldest() {
	elem := s.evictList.Back()
	if elem != nil {
		s.removeElement(elem)
	}
}

// removeElement removes a specific element from a shard.
// MUST be called with the shard lock held.
func (s *cacheShard) removeElement(e *list.Element) {
	item := s.evictList.Remove(e).(*cacheItem)
	delete(s.items, item.key)
	s.currentSize -= item.sizeBytes
}

// Janitor related types and functions (can be in a separate file)
const (
	NoExpiration      time.Duration = -1
	DefaultExpiration time.Duration = 0
)

type janitor struct {
	Interval time.Duration
	stop     chan struct{}
}

func (j *janitor) run(c *Cache) {
	ticker := time.NewTicker(j.Interval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			c.deleteExpired()
		case <-j.stop:
			return
		}
	}
}

func (c *Cache) deleteExpired() {
	now := time.Now().UnixNano()
	for _, shard := range c.shards {
		shard.mu.Lock()

		// 1. Collect keys of expired items first.
		var keysToDelete []string
		for key, elem := range shard.items {
			item := elem.Value.(*cacheItem)
			if item.expiration > 0 && now > item.expiration {
				keysToDelete = append(keysToDelete, key)
			}
		}

		// 2. Now, delete the items using the collected keys.
		for _, key := range keysToDelete {
			if elem, ok := shard.items[key]; ok {
				shard.removeElement(elem)
			}
		}

		shard.mu.Unlock()
	}
}

func stopJanitor(c *Cache) {
	if c.janitor != nil {
		c.janitor.stop <- struct{}{}
	}
}

func (c *Cache) Stop() {
	stopJanitor(c)
}
