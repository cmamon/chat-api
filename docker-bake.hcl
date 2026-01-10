group "default" {
  targets = ["api-gateway", "websocket-gateway", "chat-service", "presence-service"]
}

variable "TAG" {
  default = "latest"
}

target "api-gateway" {
  context = "."
  dockerfile = "apps/api-gateway/Dockerfile"
  tags = ["chat-server-api-gateway:${TAG}"]
}

target "websocket-gateway" {
  context = "."
  dockerfile = "apps/websocket-gateway/Dockerfile"
  tags = ["chat-server-websocket-gateway:${TAG}"]
}

target "chat-service" {
  context = "."
  dockerfile = "apps/chat-service/Dockerfile"
  tags = ["chat-server-chat-service:${TAG}"]
}

target "presence-service" {
  context = "."
  dockerfile = "apps/presence-service/Dockerfile"
  tags = ["chat-server-presence-service:${TAG}"]
}
