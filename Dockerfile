############################################################
# Dockerfile to build Node.js Application Containers
# Based on Ubuntu
############################################################
# Set the base image to Ubuntu
FROM ubuntu

# File Author / Maintainer
MAINTAINER Elvin P

# Install basic applications
RUN apt-get update 
RUN apt-get install -y build-essential curl dialog git net-tools tar wget

# install nodejs and other dependencies
RUN apt-get install -y nodejs
#RUN apt-get install --yes nodejs-legacy

# Install npm
RUN apt-get install -y npm

# Install app dependencies
RUN npm install

# Copy the application folder inside the container
ADD /app /app
# Bundle app source
#COPY . /usr/src/app

# Expose ports
EXPOSE 80

# Set the default directory where CMD will execute
WORKDIR /app

# Set the default command to execute when creating a new container
CMD [ "npm", "start" ]
