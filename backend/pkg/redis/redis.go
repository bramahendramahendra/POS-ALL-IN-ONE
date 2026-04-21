package redis

import (
	"context"
	"fmt"
	"permen_api/config"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

type RedisManager struct {
	Clients map[string]*redis.Client
}

func New() *RedisManager {
	return &RedisManager{
		Clients: make(map[string]*redis.Client),
	}
}

func (rm *RedisManager) Register(name string, redisConf *config.RedisConfig) error {
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", redisConf.Host, redisConf.Port),
		Password: redisConf.Password,
		DB:       redisConf.Db,
	})
	_, err := client.Ping(context.Background()).Result()
	if err != nil {
		return err
	}

	rm.Clients[name] = client

	return nil
}

func (rm *RedisManager) GetRedis(name string) *redis.Client {
	if _, ok := rm.Clients[name]; !ok {
		return nil
	}

	_, err := rm.Clients[name].Ping(context.Background()).Result()
	if err != nil {
		return nil
	}

	return rm.Clients[name]
}
