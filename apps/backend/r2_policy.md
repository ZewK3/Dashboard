# R2 Storage Configuration for Pet Marketplace

This document outlines the configuration and policies for Cloudflare R2 storage used in the Pet Marketplace application.

## Bucket Configuration

### Primary Bucket: `pet-images`
- **Purpose**: Store pet listing images uploaded by sellers
- **Access**: Public read, restricted write (via presigned URLs only)
- **Retention**: Automatic cleanup of orphaned images after 30 days

## CORS Configuration

Create a file `cors.json` with the following configuration:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:8080",
        "https://your-domain.com",
        "https://www.your-domain.com"
      ],
      "AllowedMethods": [
        "GET",
        "PUT",
        "POST",
        "HEAD"
      ],
      "AllowedHeaders": [
        "*"
      ],
      "ExposedHeaders": [
        "ETag"
      ],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

Apply the CORS policy:
```bash
wrangler r2 bucket cors put pet-images --cors-file=cors.json
```

## Security Policies

### Upload Restrictions
- **File Types**: Only JPEG, PNG, WebP images allowed
- **File Size**: Maximum 5MB per image
- **File Count**: Maximum 5 images per pet listing
- **Authentication**: Requires seller or admin role

### Access Control
- **Public Read**: All images publicly accessible via CDN
- **Write Access**: Only via presigned URLs with 15-minute expiration
- **Delete Access**: Only through API with proper authentication

### Naming Convention
Images are stored with the following naming pattern:
```
pets/{random-id}-{original-filename}
```

Example:
```
pets/abc123def456-golden-retriever.jpg
pets/xyz789uvw012-cute-cat.png
```

## CDN Configuration

### Custom Domain Setup
1. Configure custom domain in Cloudflare R2
2. Set up SSL certificate
3. Configure caching rules for optimal performance

### Recommended Settings
- **Browser Cache TTL**: 7 days
- **Edge Cache TTL**: 30 days
- **Image Optimization**: Enable WebP conversion
- **Compression**: Enable Gzip/Brotli

## Image Processing

### Automatic Optimization
The platform supports automatic image optimization:
- **Format Conversion**: Automatic WebP for supported browsers
- **Resizing**: Multiple sizes generated (thumbnail, medium, large)
- **Compression**: Lossless optimization for smaller file sizes

### Image Variants
For each uploaded image, the following variants are created:
- `thumbnail`: 150x150px (for listings grid)
- `medium`: 400x300px (for detail view)
- `large`: 800x600px (for full-size view)
- `original`: Original uploaded size

## Cleanup Policies

### Orphaned Image Cleanup
Images not associated with any pet listing are automatically deleted after 30 days.

### Failed Upload Cleanup
Incomplete uploads are cleaned up after 24 hours.

### Deleted Listing Cleanup
When a pet listing is deleted, associated images are moved to a temporary deletion queue and permanently deleted after 7 days (for recovery purposes).

## Monitoring and Analytics

### Metrics to Track
- Upload success/failure rates
- Storage usage and costs
- Bandwidth usage
- Geographic distribution of image requests

### Alerts
Set up alerts for:
- High error rates
- Unusual bandwidth spikes
- Storage quota approaching limits

## Development vs Production

### Development Environment
- Bucket: `pet-images-dev`
- No CDN caching
- Relaxed CORS policies for localhost

### Production Environment
- Bucket: `pet-images`
- Full CDN with custom domain
- Strict CORS policies
- Image optimization enabled

## Commands Reference

### Basic Operations
```bash
# List all objects
wrangler r2 object list pet-images

# Upload a file
wrangler r2 object put pet-images/test.jpg --file=local-image.jpg

# Download a file
wrangler r2 object get pet-images/test.jpg --file=downloaded.jpg

# Delete a file
wrangler r2 object delete pet-images/test.jpg

# Get object info
wrangler r2 object head pet-images/test.jpg
```

### Bucket Management
```bash
# Create bucket
wrangler r2 bucket create pet-images

# List buckets
wrangler r2 bucket list

# Delete bucket (be careful!)
wrangler r2 bucket delete pet-images
```

### CORS Management
```bash
# Set CORS policy
wrangler r2 bucket cors put pet-images --cors-file=cors.json

# Get CORS policy
wrangler r2 bucket cors get pet-images

# Delete CORS policy
wrangler r2 bucket cors delete pet-images
```

## Integration with Application

### Upload Flow
1. Client requests presigned URL from API
2. API validates user permissions and file metadata
3. API generates presigned URL with 15-minute expiration
4. Client uploads directly to R2 using presigned URL
5. Client notifies API of successful upload
6. API stores image URL in database

### Display Flow
1. Pet listing contains array of image URLs
2. Frontend displays images using public R2 URLs
3. CDN serves optimized images based on device/browser

### Security Considerations
- Never expose R2 credentials to frontend
- Always validate file types and sizes on server
- Use presigned URLs with minimal expiration
- Implement rate limiting for upload requests
- Monitor for abuse and unusual patterns

## Troubleshooting

### Common Issues

#### Upload Failures
- Check CORS configuration
- Verify presigned URL hasn't expired
- Ensure file size within limits
- Check internet connectivity

#### Image Not Loading
- Verify public access to bucket
- Check CDN configuration
- Ensure proper image URL format
- Check for typos in bucket/object names

#### Performance Issues
- Enable CDN caching
- Optimize image sizes
- Use appropriate image formats
- Implement lazy loading

### Debug Commands
```bash
# Check bucket CORS
wrangler r2 bucket cors get pet-images

# Test object access
curl -I https://your-r2-domain.com/pets/test.jpg

# View recent uploads
wrangler r2 object list pet-images --limit=10
```

## Cost Optimization

### Storage Costs
- Regular cleanup of unused images
- Implement image compression
- Use appropriate image formats
- Monitor storage usage trends

### Bandwidth Costs
- Enable CDN caching
- Optimize image delivery
- Implement image resizing
- Use progressive image loading

### Request Costs
- Batch operations when possible
- Cache metadata locally
- Minimize redundant requests
- Use efficient API patterns

This configuration ensures secure, performant, and cost-effective image storage for the Pet Marketplace platform.