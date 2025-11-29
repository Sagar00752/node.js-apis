import "dotenv/config";

const mask = s => (typeof s === "string" ? s.replace(/.(?=.{2})/g, "*") : s);

console.log("REDIS_USERNAME:", process.env.REDIS_USERNAME);
console.log("REDIS_HOST:    ", process.env.REDIS_HOST);
console.log("REDIS_PORT:    ", process.env.REDIS_PORT);
console.log("REDIS_TLS:     ", process.env.REDIS_TLS);
console.log("REDIS_PASSWORD: (masked) ", (process.env.REDIS_PASSWORD));