# Backend System Documentation

## Overview

The portfolio website now includes a robust backend system with scheduled job management, specifically designed to make automated requests to GitHub OAuth endpoints every 5 hours.

## Architecture

### 🏗️ System Components

1. **Scheduler Service** (`lib/services/scheduler.ts`)
   - Core job management system
   - Handles job creation, starting, stopping, and monitoring
   - In-memory job storage with persistence

2. **API Routes**
   - `/api/github` - GitHub OAuth endpoint handler
   - `/api/scheduler` - Scheduler management API
   - `/api/cron` - Legacy cron job endpoint (deprecated)

3. **Admin Dashboard** (`/admin`)
   - Web interface for managing scheduled jobs
   - Real-time job status monitoring
   - Manual job triggering capabilities

## 🚀 Features

### Scheduler Service
- ✅ **Job Creation**: Add new scheduled jobs with custom intervals
- ✅ **Job Control**: Start, stop, and trigger jobs manually
- ✅ **Status Monitoring**: Real-time job status and execution history
- ✅ **Error Handling**: Comprehensive error logging and recovery
- ✅ **Memory Management**: Automatic cleanup of old logs

### GitHub OAuth Integration
- ✅ **Automated Requests**: Scheduled requests every 5 hours
- ✅ **Token Management**: Secure handling of OAuth credentials
- ✅ **Error Recovery**: Automatic retry logic for failed requests
- ✅ **Logging**: Detailed request/response logging

### Admin Interface
- ✅ **Dashboard View**: Visual representation of all jobs
- ✅ **Real-time Updates**: Auto-refresh every 30 seconds
- ✅ **Manual Controls**: Start, stop, and trigger jobs on demand
- ✅ **Bulk Operations**: Manage multiple jobs simultaneously

## 📝 API Documentation

### Scheduler API (`/api/scheduler`)

#### GET Endpoints

```bash
# Get all job statuses
GET /api/scheduler?action=status

# Get specific job status
GET /api/scheduler?action=status&jobId=github-oauth

# Start a job
GET /api/scheduler?action=start&jobId=github-oauth

# Stop a job
GET /api/scheduler?action=stop&jobId=github-oauth

# Start all jobs
GET /api/scheduler?action=start-all

# Stop all jobs
GET /api/scheduler?action=stop-all

# Manually trigger a job
GET /api/scheduler?action=trigger&jobId=github-oauth

# Initialize GitHub OAuth job
GET /api/scheduler?action=init-github
```

#### POST Endpoints

```bash
# Add a new job
POST /api/scheduler
{
  "action": "add-job",
  "jobId": "github-oauth",
  "name": "GitHub OAuth Token Request",
  "intervalMs": 18000000
}

# Remove a job
POST /api/scheduler
{
  "action": "remove-job",
  "jobId": "github-oauth"
}
```

### GitHub API (`/api/github`)

```bash
# Make GitHub OAuth request
GET /api/github

# Manual OAuth request with custom parameters
POST /api/github
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "code": "authorization_code"
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CODE=optional_authorization_code
GITHUB_REDIRECT_URI=https://devendrahamal.com.np/auth/callback

# GitHub API Token (optional, for higher rate limits)
GITHUB_TOKEN=your_github_personal_access_token

# Application URLs
NEXT_PUBLIC_URL=http://localhost:3000

# Social Media URLs
NEXT_PUBLIC_GITHUB_URL=https://github.com/Devendra000
NEXT_PUBLIC_LINKEDIN_URL=https://linkedin.com/in/devendra-hamal
NEXT_PUBLIC_EMAIL=devendra.hamal058@gmail.com
```

### GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create a new OAuth App with:
   - **Application name**: Devendra Hamal Portfolio
   - **Homepage URL**: https://devendrahamal.com.np
   - **Authorization callback URL**: https://devendrahamal.com.np/auth/callback
3. Copy the Client ID and Client Secret to your `.env.local` file

## 🏃‍♂️ Usage

### Starting the System

1. **Development Mode**:
   ```bash
   pnpm dev
   ```

2. **Access Admin Dashboard**:
   ```
   http://localhost:3000/admin
   ```

3. **Initialize GitHub Job**:
   - Click "Init GitHub Job" in the admin dashboard
   - Or make a GET request to `/api/scheduler?action=init-github`

### Managing Jobs

#### Via Admin Dashboard
1. Navigate to `/admin`
2. View all job statuses in real-time
3. Use buttons to start, stop, or trigger jobs
4. Monitor execution history and next run times

#### Via API
```bash
# Initialize and start GitHub OAuth job
curl "http://localhost:3000/api/scheduler?action=init-github"

# Check job status
curl "http://localhost:3000/api/scheduler?action=status"

# Manually trigger the job
curl "http://localhost:3000/api/scheduler?action=trigger&jobId=github-oauth"
```

## 📊 Monitoring

### Job Status Information
- **ID**: Unique job identifier
- **Name**: Human-readable job name
- **Status**: Running/Stopped
- **Interval**: Time between executions
- **Run Count**: Total number of executions
- **Last Run**: Timestamp of last execution
- **Next Run**: Timestamp of next scheduled execution

### Logs
- Console logs for all job operations
- Error logging for failed executions
- Request/response logging for GitHub API calls

## 🛡️ Security

### Best Practices
- ✅ Environment variables for sensitive data
- ✅ Error handling without exposing sensitive information
- ✅ Admin dashboard with no authentication (for development)
- ⚠️ **Production**: Add authentication to admin routes
- ⚠️ **Production**: Use HTTPS for all API calls
- ⚠️ **Production**: Implement rate limiting

### Production Considerations
1. **Add Authentication**: Protect admin routes with authentication
2. **Use HTTPS**: Ensure all communication is encrypted
3. **Rate Limiting**: Implement API rate limiting
4. **Database Storage**: Replace in-memory storage with database
5. **Monitoring**: Add proper monitoring and alerting

## 🚨 Troubleshooting

### Common Issues

1. **Job Not Starting**:
   - Check environment variables
   - Verify GitHub OAuth credentials
   - Check console logs for errors

2. **GitHub API Errors**:
   - Verify Client ID and Client Secret
   - Check if OAuth app is properly configured
   - Ensure redirect URI matches

3. **Admin Dashboard Not Loading**:
   - Check if `/admin` route is accessible
   - Verify API endpoints are responding
   - Check browser console for errors

### Debug Commands

```bash
# Check job status
curl "http://localhost:3000/api/scheduler?action=status"

# Test GitHub API directly
curl "http://localhost:3000/api/github"

# Get scheduler help
curl "http://localhost:3000/api/scheduler"
```

## 🔄 Development Workflow

1. **Start Development Server**: `pnpm dev`
2. **Access Admin Dashboard**: `http://localhost:3000/admin`
3. **Initialize GitHub Job**: Click "Init GitHub Job"
4. **Monitor Execution**: Watch real-time updates in dashboard
5. **Test Manual Trigger**: Use "Trigger Now" button
6. **Check Logs**: Monitor console output

## 📈 Future Enhancements

### Planned Features
- [ ] Database persistence for job data
- [ ] Web-based log viewer
- [ ] Email notifications for job failures
- [ ] Multiple job types support
- [ ] Advanced scheduling (cron expressions)
- [ ] Job dependency management
- [ ] Performance metrics dashboard
- [ ] Authentication and user management

### Scalability Considerations
- Database integration for job persistence
- Redis for distributed job management
- Webhook integration for external notifications
- Advanced error handling and retry logic
- Horizontal scaling support

---

## 📞 Support

For issues or questions regarding the backend system:

1. Check the troubleshooting section
2. Review console logs for errors
3. Test API endpoints manually
4. Contact the development team

**Author**: Devendra Hamal  
**Email**: devendra.hamal058@gmail.com  
**GitHub**: https://github.com/Devendra000