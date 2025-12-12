# Azure Contact Book Application

A production-ready 3-tier contact book web application deployed on Azure.

## Project Structure

```
azure-contact-book/
├── frontend/          # React TypeScript frontend (Azure Static Web Apps)
├── backend/           # Node.js Express API (Azure App Service)
└── .kiro/            # Kiro spec files
    └── specs/
        └── azure-contact-book/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

## Technology Stack

- **Frontend**: React 18+ with TypeScript
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL 14+
- **Cloud Platform**: Microsoft Azure

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 14+
- Azure account (for deployment)

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm start
```

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database connection string
npm start
```

### Database Setup

```bash
# Create and initialize the database
psql -U postgres -f backend/init.sql

# Or step by step:
psql -U postgres -c "CREATE DATABASE contactbook;"
psql -U postgres -d contactbook -f backend/init.sql
```

For detailed database setup instructions, including Azure PostgreSQL configuration, see [backend/README.md](backend/README.md#database-setup).

## Environment Configuration

### Frontend (.env)
- `REACT_APP_API_BASE_URL`: Backend API URL

### Backend (.env)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `CORS_ORIGIN`: Frontend URL for CORS configuration

## Azure Deployment Guide

This section provides step-by-step instructions for deploying the Contact Book application to Microsoft Azure.

### Architecture Overview

The application uses a 3-tier architecture on Azure:
- **Tier 1**: React frontend on Azure Static Web Apps
- **Tier 2**: Node.js API on Azure App Service
- **Tier 3**: PostgreSQL database on Azure Database for PostgreSQL

### Prerequisites for Azure Deployment

- Azure account with active subscription
- Azure CLI installed (`az --version` to verify)
- Git repository for your code (GitHub recommended for Static Web Apps)
- Node.js 18+ installed locally

### Step 1: Provision Azure Database for PostgreSQL

#### 1.1 Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="rg-contactbook"
LOCATION="westus"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

#### 1.2 Create PostgreSQL Flexible Server

```bash
# Set database variables
DB_SERVER_NAME="contactbook-db"
DB_ADMIN_USER="contactadmin"
DB_ADMIN_PASSWORD="YourSecurePassword123!"
DB_NAME="contactbook"
-$(date +%s)
# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password $DB_ADMIN_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14 \
  --storage-size 32 \
  --public-access 0.0.0.0-255.255.255.255
```

**Note**: The `--public-access` setting above allows all IPs temporarily. We'll restrict this after setting up App Service.

#### 1.3 Create Database

```bash
# Create the contactbook database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME
```

#### 1.4 Initialize Database Schema

```bash
# Get connection string
DB_HOST="${DB_SERVER_NAME}.postgres.database.azure.com"
DB_CONNECTION_STRING="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"

# Run initialization script
psql "$DB_CONNECTION_STRING" -f backend/init.sql
```

Alternatively, use Azure Cloud Shell or connect using pgAdmin/DBeaver with the connection details.

### Step 2: Deploy Backend API to Azure App Service

#### 2.1 Create App Service Plan

```bash
# Set App Service variables
APP_SERVICE_PLAN="plan-contactbook-api"
APP_SERVICE_NAME="contactbook-api"

# Create App Service Plan (Linux, B1 tier)
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1
```

#### 2.2 Create Web App

```bash
# Create Web App with Node.js 18 runtime
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $APP_SERVICE_NAME \
  --runtime "NODE:18-lts"
```

#### 2.3 Configure Environment Variables

```bash
# Set application settings (environment variables)
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --settings \
    NODE_ENV="production" \
    DATABASE_URL="$DB_CONNECTION_STRING" \
    PORT="8080" \
    CORS_ORIGIN="https://YOUR_STATIC_WEB_APP_URL.azurestaticapps.net"
```

**Note**: Update `CORS_ORIGIN` after deploying the frontend in Step 3.

#### 2.4 Enable HTTPS Only

```bash
# Enforce HTTPS
az webapp update \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --https-only true
```

#### 2.5 Deploy Backend Code

**Option A: Deploy from Local Git**

```bash
# Configure local git deployment
az webapp deployment source config-local-git \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME

# Get deployment credentials
az webapp deployment list-publishing-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME

# Add Azure remote and push
cd backend
git init
git add .
git commit -m "Initial backend commit"
git remote add azure <GIT_URL_FROM_ABOVE>
git push azure main
```

**Option B: Deploy via ZIP**

```bash
cd backend
npm install --production
zip -r backend.zip . -x "node_modules/*" -x ".git/*"

az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --src backend.zip
```

**Option C: Deploy via GitHub Actions**

Set up continuous deployment from your GitHub repository:

```bash
az webapp deployment github-actions add \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --repo "YOUR_GITHUB_USERNAME/YOUR_REPO_NAME" \
  --branch main \
  --login-with-github
```

#### 2.6 Verify Backend Deployment

```bash
# Get the backend URL
BACKEND_URL="https://${APP_SERVICE_NAME}.azurewebsites.net"
echo "Backend URL: $BACKEND_URL"

# Test the API
curl "${BACKEND_URL}/api/contacts"
```

### Step 3: Deploy Frontend to Azure Static Web Apps

#### 3.1 Create Static Web App

**Option A: Using Azure Portal (Recommended for GitHub integration)**

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → Search for "Static Web App"
3. Fill in the details:
   - **Resource Group**: Select `rg-contactbook`
   - **Name**: `contactbook-frontend`
   - **Region**: Choose closest region
   - **Source**: GitHub
   - **GitHub Account**: Authorize and select your repository
   - **Branch**: `main`
   - **Build Presets**: React
   - **App location**: `/frontend`
   - **Api location**: (leave empty)
   - **Output location**: `build`
4. Click "Review + Create" → "Create"

This will automatically create a GitHub Actions workflow for CI/CD.

**Option B: Using Azure CLI**

```bash
STATIC_WEB_APP_NAME="contactbook-frontend"

az staticwebapp create \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --source https://github.com/YOUR_USERNAME/YOUR_REPO \
  --branch main \
  --app-location "/frontend" \
  --output-location "build" \
  --login-with-github
```

#### 3.2 Configure Frontend Environment Variables

Static Web Apps uses build-time environment variables. Configure them in the Azure Portal:

1. Go to your Static Web App in Azure Portal
2. Navigate to "Configuration" → "Application settings"
3. Add the following:
   - **Name**: `REACT_APP_API_BASE_URL`
   - **Value**: `https://YOUR_APP_SERVICE_NAME.azurewebsites.net`

Or via CLI:

```bash
az staticwebapp appsettings set \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --setting-names REACT_APP_API_BASE_URL="$BACKEND_URL"
```

#### 3.3 Get Static Web App URL

```bash
# Get the frontend URL
FRONTEND_URL=$(az staticwebapp show \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "defaultHostname" -o tsv)

echo "Frontend URL: https://$FRONTEND_URL"
```

#### 3.4 Update Backend CORS Configuration

Now update the backend's CORS_ORIGIN with the actual frontend URL:

```bash
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --settings CORS_ORIGIN="https://$FRONTEND_URL"

# Restart the app service to apply changes
az webapp restart \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME
```

### Step 4: Configure Networking and Security

#### 4.1 Restrict Database Access

Update PostgreSQL firewall to only allow App Service:

```bash
# Get App Service outbound IPs
OUTBOUND_IPS=$(az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --query "outboundIpAddresses" -o tsv)

# Add firewall rules for each IP
IFS=',' read -ra IP_ARRAY <<< "$OUTBOUND_IPS"
for ip in "${IP_ARRAY[@]}"; do
  az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $DB_SERVER_NAME \
    --rule-name "AppService-${ip}" \
    --start-ip-address $ip \
    --end-ip-address $ip
done

# Remove the allow-all rule
az postgres flexible-server firewall-rule delete \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --rule-name "AllowAll_0.0.0.0-255.255.255.255" \
  --yes
```

#### 4.2 Enable SSL/TLS

Both Static Web Apps and App Service automatically provide HTTPS. Ensure SSL is enforced:

```bash
# Verify HTTPS-only is enabled on App Service
az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --query "httpsOnly"
```

#### 4.3 Configure CORS Properly

The backend already has CORS middleware configured. Verify the settings:

```bash
# Check CORS_ORIGIN setting
az webapp config appsettings list \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --query "[?name=='CORS_ORIGIN'].value" -o tsv
```

### Step 5: Verify Complete Deployment

#### 5.1 Test the Application

1. Open the frontend URL in your browser: `https://YOUR_FRONTEND_URL.azurestaticapps.net`
2. Test creating a new contact
3. Test viewing contact list
4. Test editing a contact
5. Test deleting a contact

#### 5.2 Check Application Logs

**Backend Logs:**
```bash
# Stream App Service logs
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME
```

**Frontend Logs:**
```bash
# View Static Web App logs in Azure Portal
# Navigate to: Static Web App → Monitoring → Log stream
```

#### 5.3 Monitor Application Health

```bash
# Check App Service health
az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --query "state"

# Check database server status
az postgres flexible-server show \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --query "state"
```

### Step 6: Post-Deployment Configuration

#### 6.1 Set Up Custom Domain (Optional)

**For Static Web App:**
```bash
az staticwebapp hostname set \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname "www.yourdomain.com"
```

**For App Service:**
```bash
az webapp config hostname add \
  --resource-group $RESOURCE_GROUP \
  --webapp-name $APP_SERVICE_NAME \
  --hostname "api.yourdomain.com"
```

#### 6.2 Enable Application Insights (Optional)

```bash
# Create Application Insights
az monitor app-insights component create \
  --app contactbook-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app contactbook-insights \
  --resource-group $RESOURCE_GROUP \
  --query "instrumentationKey" -o tsv)

# Add to App Service
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="$INSTRUMENTATION_KEY"
```

#### 6.3 Configure Automated Backups

```bash
# Enable automated backups for PostgreSQL
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --name backup_retention_days \
  --value 7
```

### Troubleshooting

#### Backend API Not Responding

1. Check App Service logs: `az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME`
2. Verify environment variables are set correctly
3. Ensure database connection string is correct
4. Check if App Service is running: `az webapp show --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME --query "state"`

#### Frontend Can't Connect to Backend

1. Verify CORS_ORIGIN is set to the correct frontend URL
2. Check that REACT_APP_API_BASE_URL is set correctly in Static Web App configuration
3. Ensure backend API is accessible: `curl https://YOUR_APP_SERVICE.azurewebsites.net/api/contacts`
4. Check browser console for CORS errors

#### Database Connection Issues

1. Verify firewall rules allow App Service IPs
2. Check connection string format includes `?sslmode=require`
3. Verify database credentials are correct
4. Test connection from Azure Cloud Shell: `psql "YOUR_CONNECTION_STRING"`

#### Static Web App Build Failures

1. Check GitHub Actions workflow logs in your repository
2. Verify `app_location` is set to `/frontend`
3. Verify `output_location` is set to `build`
4. Ensure `package.json` has correct build script

### Cost Optimization

- **Development**: Use B1 tier for App Service, Burstable tier for PostgreSQL
- **Production**: Consider scaling up based on traffic
- **Static Web Apps**: Free tier includes 100GB bandwidth/month
- **Database**: Enable auto-pause for development environments

### Cleanup Resources

To delete all Azure resources when no longer needed:

```bash
az group delete \
  --name $RESOURCE_GROUP \
  --yes \
  --no-wait
```

## Documentation

See the `.kiro/specs/azure-contact-book/` directory for detailed:
- Requirements documentation
- Design documentation
- Implementation tasks

## License

ISC
