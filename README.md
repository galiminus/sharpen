A lot of code was taken from [express-sharp](https://github.com/pmb0/express-sharp).

## Installation

```
npm install
```

## Configuration

Create a .env file with those required keys:

```
NODE_ENV=production
BASE_HOST=s3.amazonaws.com
BUCKETS=[comma separated list of whitelisted S3 buckets]
```

## Usage

Sample url:

```
curl http://localhost:8000/resize/my_image.png?crop=limit&height=800&url=my_s3_bucket/image_path.png.png&version=3&width=1000
```

## Deployment

```
npm install -g foreman
```

You can use the `./deploy.sh` script as a sample script for deployment.

