.PHONY: push

push:
	docker build -t agentxpay-indexer -f Dockerfile .
	docker tag agentxpay-indexer rzexin/agentxpay-indexer:v1.0.0
	docker push rzexin/agentxpay-indexer:v1.0.0
