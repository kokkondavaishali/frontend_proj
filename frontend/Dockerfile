FROM nginx:alpine

# Copy static frontend files to Nginx public directory
COPY . /usr/share/nginx/html

# Expose port 80 (will map to 3000 in docker-compose)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
