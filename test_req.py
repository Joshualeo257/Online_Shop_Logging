import requests
from concurrent.futures import ThreadPoolExecutor
import random

# Target your local Express backend
valid_url = "http://localhost:5000/api/products?category=Electronics"
invalid_url = "http://localhost:5000/api/invalid"  # Missing ?category
num_requests = 1000
failure_ratio = 0.6  # 20% of requests will be intentionally incorrect

def send_request():
    try:
        # Randomly decide whether to use a valid or invalid request
        if random.random() < failure_ratio:
            url = invalid_url
        else:
            url = valid_url

        r = requests.get(url, timeout=5)
        print(f"URL: {url} | Status: {r.status_code}")
    except Exception as e:
        print(f"Error: {e}")

# Send 1000 concurrent requests using 50 threads
with ThreadPoolExecutor(max_workers=50) as executor:
    for _ in range(num_requests):
        executor.submit(send_request)
