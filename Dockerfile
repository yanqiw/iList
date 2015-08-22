FROM google/nodejs

WORKDIR /app
ADD package.json /app/
RUN npm install
RUN npm install -g forever
ADD . /app

CMD []
ENTRYPOINT ["forever", "server.js"]