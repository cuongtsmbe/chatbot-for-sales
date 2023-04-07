/* abstract */ 
class SessionStore {
  findSession(id) {}
  saveSession(id, session) {}
  findAllSessions() {}
}

const SESSION_TTL = 24 * 60 * 60;
const mapSession = (value) => {
  var { userID, username, connected } = JSON.parse(value);
  return userID ? { userID, username, connected: connected === "true" } : undefined;
}

class RedisSessionStore extends SessionStore {
  constructor(redisClient) {
    super();
    this.redisClient = redisClient;
  }

  findSession(id) {
    return this.redisClient
      .get(`session:${id}`)
      .then(mapSession);
  }

  saveSession(id, { userID, username, connected }) {
    this.redisClient
      .multi()
      .set(
        `session:${id}`,JSON.stringify({userID,username,connected})
      )
      .expire(`session:${id}`, SESSION_TTL)
      .exec();
  }

  async findAllSessions() {
    const keys = new Set();
    let nextIndex = 0;
    do {
      const [nextIndexAsStr, results] = await this.redisClient.scan(
        nextIndex,
        "MATCH",
        "session:*",
        "COUNT",
        "100"
      );
      nextIndex = parseInt(nextIndexAsStr, 10);
      results.forEach((s) => keys.add(s));
    } while (nextIndex !== 0);
    const commands = [];
    keys.forEach((key) => {
      commands.push(["GET", key]);
    });
    return this.redisClient
      .multi(commands)
      .exec()
      .then((results) => {
        return results
          .map(([err, session]) => (err ? undefined : mapSession(session)))
          .filter((v) => !!v);
      });
  }
}

module.exports = {
  RedisSessionStore,
};
