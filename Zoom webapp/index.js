import { ChatbotClient } from "@zoom/rivet/chatbot";
import 'dotenv/config'
(async () => {
  var message_id = 0
  var messages = []
  const chatbotClient = new ChatbotClient({
    clientId: "LZ_00n7jS5yQngiZHGhTg",
    clientSecret: process.env.CLIENT_SECRET,
    webhooksSecretToken: process.env.WEBHOOK_SECRET_TOKEN,
    port:1234
  }); 

  chatbotClient.webEventConsumer.onSlashCommand('*', async ({ say, payload }) => {
    console.log(payload);
    message_id++
    messages.push(payload.cmd)
    console.log(messages)
    var inverted =  payload.cmd
    var invertedFinal = inverted.split('').reverse().join('')
    await say(invertedFinal);
  });
  chatbotClient.webEventConsumer.on

  const server = await chatbotClient.start();
  console.log(`Zoom Rivet Events Server running on: ${JSON.stringify(server.address())}`);
})();
