package janitor

import (
	"sync"
	"testing"
	"time"
)

func TestNewCache(t *testing.T) {
	t.Run("creates cache with valid parameters", func(t *testing.T) {
		cache := NewCache(1024, 4, time.Minute, time.Second)
		defer cache.Stop()

		if cache == nil {
			t.Fatal("expected cache to be created")
		}
		if len(cache.shards) != 4 {
			t.Errorf("expected 4 shards, got %d", len(cache.shards))
		}
		if cache.numShards != 4 {
			t.Errorf("expected numShards to be 4, got %d", cache.numShards)
		}
		if cache.defaultExpiration != time.Minute {
			t.Errorf("expected defaultExpiration to be 1 minute, got %v", cache.defaultExpiration)
		}
	})

	t.Run("creates cache with default shards when numShards is zero", func(t *testing.T) {
		cache := NewCache(1024, 0, time.Minute, time.Second)
		defer cache.Stop()

		if len(cache.shards) != 64 {
			t.Errorf("expected 64 default shards, got %d", len(cache.shards))
		}
	})

	t.Run("creates cache with default shards when numShards is negative", func(t *testing.T) {
		cache := NewCache(1024, -1, time.Minute, time.Second)
		defer cache.Stop()

		if len(cache.shards) != 64 {
			t.Errorf("expected 64 default shards, got %d", len(cache.shards))
		}
	})

	t.Run("creates cache without janitor when cleanupInterval is zero", func(t *testing.T) {
		cache := NewCache(1024, 4, time.Minute, 0)

		if cache.janitor != nil {
			t.Error("expected janitor to be nil when cleanupInterval is 0")
		}
	})
}

func TestCacheSetAndGet(t *testing.T) {
	cache := NewCache(1024, 4, time.Minute, 0)

	t.Run("set and get item", func(t *testing.T) {
		cache.Set("key1", "value1", 10, time.Minute)

		val, ok := cache.Get("key1")
		if !ok {
			t.Fatal("expected to find key1")
		}
		if val != "value1" {
			t.Errorf("expected value1, got %v", val)
		}
	})

	t.Run("get non-existent key returns false", func(t *testing.T) {
		_, ok := cache.Get("nonexistent")
		if ok {
			t.Error("expected ok to be false for non-existent key")
		}
	})

	t.Run("update existing key", func(t *testing.T) {
		cache.Set("key2", "value2", 10, time.Minute)
		cache.Set("key2", "value2-updated", 15, time.Minute)

		val, ok := cache.Get("key2")
		if !ok {
			t.Fatal("expected to find key2")
		}
		if val != "value2-updated" {
			t.Errorf("expected value2-updated, got %v", val)
		}
	})

	t.Run("set with DefaultExpiration uses cache default", func(t *testing.T) {
		cache.Set("key3", "value3", 10, DefaultExpiration)

		val, ok := cache.Get("key3")
		if !ok {
			t.Fatal("expected to find key3")
		}
		if val != "value3" {
			t.Errorf("expected value3, got %v", val)
		}
	})

	t.Run("set with NoExpiration", func(t *testing.T) {
		cache.Set("key4", "value4", 10, NoExpiration)

		val, ok := cache.Get("key4")
		if !ok {
			t.Fatal("expected to find key4")
		}
		if val != "value4" {
			t.Errorf("expected value4, got %v", val)
		}
	})
}

func TestCacheExpiration(t *testing.T) {
	cache := NewCache(1024, 4, time.Millisecond*50, 0)

	t.Run("expired item returns false", func(t *testing.T) {
		cache.Set("expiring", "value", 10, time.Millisecond*10)

		_, ok := cache.Get("expiring")
		if !ok {
			t.Fatal("expected to find expiring key immediately")
		}

		time.Sleep(time.Millisecond * 20)

		_, ok = cache.Get("expiring")
		if ok {
			t.Error("expected key to be expired")
		}
	})
}

func TestCacheDelete(t *testing.T) {
	cache := NewCache(1024, 4, time.Minute, 0)

	t.Run("delete existing key", func(t *testing.T) {
		cache.Set("deleteMe", "value", 10, time.Minute)

		cache.Delete("deleteMe")

		_, ok := cache.Get("deleteMe")
		if ok {
			t.Error("expected key to be deleted")
		}
	})

	t.Run("delete non-existent key does not panic", func(t *testing.T) {
		cache.Delete("nonexistent")
	})
}

func TestCacheLRUEviction(t *testing.T) {
	cache := NewCache(100, 1, time.Hour, 0)

	t.Run("evicts oldest item when size limit exceeded", func(t *testing.T) {
		cache.Set("first", "value1", 50, time.Hour)
		cache.Set("second", "value2", 50, time.Hour)

		_, ok1 := cache.Get("first")
		_, ok2 := cache.Get("second")
		if !ok1 || !ok2 {
			t.Fatal("expected both keys to exist")
		}

		cache.Set("third", "value3", 50, time.Hour)

		_, ok1 = cache.Get("first")
		if ok1 {
			t.Error("expected first to be evicted")
		}

		_, ok2 = cache.Get("second")
		_, ok3 := cache.Get("third")
		if !ok2 || !ok3 {
			t.Error("expected second and third to exist")
		}
	})
}

func TestCacheLRUOrder(t *testing.T) {
	cache := NewCache(150, 1, time.Hour, 0)

	t.Run("accessing item moves it to front", func(t *testing.T) {
		cache.Set("a", "1", 50, time.Hour)
		cache.Set("b", "2", 50, time.Hour)
		cache.Set("c", "3", 50, time.Hour)

		cache.Get("a")

		cache.Set("d", "4", 50, time.Hour)

		_, okA := cache.Get("a")
		_, okB := cache.Get("b")
		_, okC := cache.Get("c")
		_, okD := cache.Get("d")

		if !okA {
			t.Error("expected 'a' to still exist (was accessed recently)")
		}
		if okB {
			t.Error("expected 'b' to be evicted (oldest)")
		}
		if !okC || !okD {
			t.Error("expected 'c' and 'd' to exist")
		}
	})
}

func TestCacheDeleteExpired(t *testing.T) {
	cache := NewCache(1024, 4, time.Millisecond*10, 0)

	t.Run("deleteExpired removes expired items", func(t *testing.T) {
		cache.Set("expires", "value", 10, time.Millisecond*5)
		cache.Set("stays", "value", 10, time.Hour)

		time.Sleep(time.Millisecond * 10)

		cache.deleteExpired()

		_, okExpired := cache.Get("expires")
		_, okStays := cache.Get("stays")

		if okExpired {
			t.Error("expected expired item to be deleted")
		}
		if !okStays {
			t.Error("expected non-expired item to remain")
		}
	})
}

func TestCacheJanitor(t *testing.T) {
	t.Run("janitor cleans up expired items", func(t *testing.T) {
		cache := NewCache(1024, 4, time.Millisecond*10, time.Millisecond*20)
		defer cache.Stop()

		cache.Set("shortLived", "value", 10, time.Millisecond*5)

		time.Sleep(time.Millisecond * 50)

		_, ok := cache.Get("shortLived")
		if ok {
			t.Error("expected janitor to have cleaned up expired item")
		}
	})
}

func TestCacheStop(t *testing.T) {
	t.Run("stop does not panic when janitor is nil", func(t *testing.T) {
		cache := NewCache(1024, 4, time.Minute, 0)
		cache.Stop()
	})
}

func TestCacheConcurrency(t *testing.T) {
	cache := NewCache(10240, 16, time.Minute, 0)

	t.Run("concurrent operations are safe", func(t *testing.T) {
		var wg sync.WaitGroup
		numGoroutines := 100
		numOperations := 100

		for i := 0; i < numGoroutines; i++ {
			wg.Add(1)
			go func(id int) {
				defer wg.Done()
				for j := 0; j < numOperations; j++ {
					key := "key"
					cache.Set(key, id*1000+j, 10, time.Minute)
					cache.Get(key)
					cache.Delete(key)
				}
			}(i)
		}

		wg.Wait()
	})
}

func TestGetShard(t *testing.T) {
	cache := NewCache(1024, 4, time.Minute, 0)

	t.Run("same key always returns same shard", func(t *testing.T) {
		shard1 := cache.getShard("testkey")
		shard2 := cache.getShard("testkey")

		if shard1 != shard2 {
			t.Error("expected same shard for same key")
		}
	})

	t.Run("different keys may return different shards", func(t *testing.T) {
		shards := make(map[*cacheShard]bool)
		for i := 0; i < 100; i++ {
			shard := cache.getShard(string(rune('a' + i)))
			shards[shard] = true
		}

		if len(shards) < 2 {
			t.Error("expected different keys to potentially hit different shards")
		}
	})
}

func TestCacheConstants(t *testing.T) {
	t.Run("NoExpiration constant", func(t *testing.T) {
		if NoExpiration != -1 {
			t.Errorf("expected NoExpiration to be -1, got %v", NoExpiration)
		}
	})

	t.Run("DefaultExpiration constant", func(t *testing.T) {
		if DefaultExpiration != 0 {
			t.Errorf("expected DefaultExpiration to be 0, got %v", DefaultExpiration)
		}
	})
}
