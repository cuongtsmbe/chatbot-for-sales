FROM node:18.14.2

RUN npm install -g nodemon

WORKDIR /usr/src/chatbotZi

COPY . .

#Copy all files and directories located where the Dockerfile is placed into the workdir.

EXPOSE 8080
