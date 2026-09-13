package com.cpi.cpi_backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.SimpleCacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
@EnableCaching
public class RedisConfig implements CachingConfigurer {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);

    @Value("${spring.data.redis.host:127.0.0.1}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${spring.data.redis.url:}")
    private String redisUrl;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        if (redisUrl != null && !redisUrl.isBlank()) {
            try {
                java.net.URI uri = java.net.URI.create(redisUrl);
                RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
                config.setHostName(uri.getHost());
                config.setPort(uri.getPort() > 0 ? uri.getPort() : 6379);
                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":");
                    if (userInfo.length > 1) {
                        config.setPassword(userInfo[1]);
                    } else if (userInfo.length == 1) {
                        config.setPassword(userInfo[0]);
                    }
                }
                log.info("Connecting Redis via REDIS_URL to host {}:{}", config.getHostName(), config.getPort());
                return new LettuceConnectionFactory(config);
            } catch (Exception e) {
                log.warn("Failed to parse REDIS_URL, falling back to host/port: {}", e.getMessage());
            }
        }

        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(redisHost);
        config.setPort(redisPort);
        if (redisPassword != null && !redisPassword.isBlank()) {
            config.setPassword(redisPassword);
        }
        log.info("Connecting Redis to host {}:{}", redisHost, redisPort);
        return new LettuceConnectionFactory(config);
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .transactionAware()
                .build();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new SimpleCacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, org.springframework.cache.Cache cache, Object key) {
                log.warn("Redis GET error on cache '{}' for key '{}'. Falling back to Supabase/PostgreSQL. Error: {}", 
                        cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, org.springframework.cache.Cache cache, Object key, Object value) {
                log.warn("Redis PUT error on cache '{}' for key '{}'. Continuing without cache. Error: {}", 
                        cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, org.springframework.cache.Cache cache, Object key) {
                log.warn("Redis EVICT error on cache '{}' for key '{}'. Continuing without cache. Error: {}", 
                        cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, org.springframework.cache.Cache cache) {
                log.warn("Redis CLEAR error on cache '{}'. Continuing without cache. Error: {}", 
                        cache.getName(), exception.getMessage());
            }
        };
    }
}
