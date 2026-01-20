# Speedtest.net Integration - Exact Match Setup

Your dev FPS overlay now uses the **official Ookla Speedtest CLI** to get the exact same results as speedtest.net.

## ✅ Already Installed (macOS)

The Ookla CLI is installed and configured on your Mac. The API route is ready at `/api/speedtest`.

## How It Works

1. **Client requests speed test** → FPS overlay calls `/api/speedtest`
2. **Server runs Ookla CLI** → Executes `speedtest --format=json`
3. **Same servers as speedtest.net** → Uses Ookla's official server selection
4. **Results returned** → Downloads, uploads, ping/jitter exactly match the website

## Testing the API

```bash
# Test the API endpoint
curl http://localhost:3000/api/speedtest

# Or in your browser
http://localhost:3000/api/speedtest
```

## Expected Response

```json
{
  "downMbps": 72.76,
  "upMbps": 69.41,
  "latency": 10.278,
  "jitter": 1.131,
  "timestamp": 1737370338000,
  "server": {
    "name": "Server Name",
    "location": "City, State",
    "country": "US",
    "host": "example.speedtest.net:8080",
    "id": 12345
  },
  "client": {
    "ip": "1.2.3.4",
    "isp": "Your ISP"
  }
}
```

## Deployment Notes

When deploying to production (Vercel, etc.), install the CLI:

### Vercel
Add to `vercel.json`:
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "buildCommand": "curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | bash && apt-get install speedtest"
}
```

### Docker
Add to `Dockerfile`:
```dockerfile
RUN curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | bash
RUN apt-get install speedtest
```

### Ubuntu/Debian Server
```bash
curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | sudo bash
sudo apt-get install speedtest
```

### macOS Server
```bash
brew tap teamookla/speedtest
brew install speedtest
```

## Fallback Behavior

If the Ookla CLI is not available, the overlay automatically falls back to:
1. DeviceMonitor speed test (Cloudflare endpoints)
2. Browser-based speed test (in-browser fetch)

This ensures the overlay always works, even without the CLI.

## Why This Matches Speedtest.net

- ✅ **Same CLI** - Uses Ookla's official tool
- ✅ **Same servers** - Connects to the same test servers
- ✅ **Same algorithm** - Uses Ookla's proprietary measurement logic
- ✅ **Same protocol** - HTTP/3, multi-stream, same as the website

The only difference is it runs server-side instead of in the browser, which actually makes it MORE accurate (no tab throttling).

## Cache

Results are cached for 10 seconds to prevent abuse and reduce server load.
