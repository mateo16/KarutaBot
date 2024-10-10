const { Client } = require('discord.js-selfbot-v13');
const tesseract = require('tesseract.js');
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const client = new Client();
const MINS30 = 30 * 60 * 1000;

// --- CONGIGURATION --- 
const config = require('./config.json');
const { CHANNEL_ID, USER_TOKEN } = config;

const wordList = [
  'jujutsu', 'one piece', 'demon slayer', 'naruto', 'bleach', 'dragon ball',
  'hunter', 'my hero academia', 'classroom of the elite', 'the prince of tennis',
  'avatar', 'genshin impact', 'fate','fullmetal','jojo'
];
// -----------------

function extractAndSaveData(message) {
  const characterMatch = message.match(/Character · (.+)/);
  const seriesMatch = message.match(/Series · (.+)/);
  const wishlistedMatch = message.match(/Wishlisted · (\d+)/);
  const editionMatch = message.match(/Showing edition (\d+)/);

  const character = characterMatch ? characterMatch[1].trim() : 'Unknown';
  const series = seriesMatch ? seriesMatch[1].trim() : 'Unknown';
  const wishlisted = wishlistedMatch ? wishlistedMatch[1].trim() : '0';
  const edition = editionMatch ? editionMatch[1].trim() : '0';

  const wishlistedNumber = parseInt(wishlisted, 10);
  const editionNumber = parseInt(edition, 10);

  const isEditionSeven = editionNumber === 7;
  const isWishlistedHigh = wishlistedNumber > 50;
  const isAnimeOfInterest = wordList.some(word => series.toLowerCase().includes(word));

  const formattedString = `♡${wishlisted} · ◈${edition} · ${series} · ${character}\n`;
  console.log(`Saved ${formattedString}`);

  fs.appendFileSync('CARDS.txt', formattedString, 'utf8');
  if (isEditionSeven || isWishlistedHigh || isAnimeOfInterest) {
    fs.appendFileSync('BESTS.txt', formattedString, 'utf8');
  }
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldSendMessage(per) {
  return Math.random() < per;
}

function checkForAnime(anime1, anime2, anime3) {
  for (const word of wordList) {
    if (anime1.toLowerCase().includes(word.toLowerCase())) {
      return 1;
    }
    if (anime2.toLowerCase().includes(word.toLowerCase())) {
      return 2;
    }
    if (anime3.toLowerCase().includes(word.toLowerCase())) {
      return 3;
    }
  }
  return false;
}

async function getHighestOrRandom(ed1, ed2, ed3) {
  const edArray = [ed1, ed2, ed3];

  const numbers = edArray.map(ed => ed === '' ? NaN : Number(ed)).filter(num => !isNaN(num));

  // Case 1: All are numbers
  if (numbers.length === 3) {
    const highest = Math.max(...numbers);
    return edArray.findIndex(value => Number(value) === highest) + 1;
  }

  // Case 2: Some are NaNs and at least one is > 4
  const higherThanFour = numbers.filter(num => num > 4);
  if (higherThanFour.length > 0) {
    const selectedValue = higherThanFour[0];
    return edArray.findIndex(value => Number(value) === selectedValue) + 1;
  }

  // Case 3: No numbers > 4, exclude 1s and choose randomly between the NaNs and the numbers lower than four that are not one
  const nanValues = edArray.filter(item => item === '' || isNaN(Number(item)));
  const validNumbers = numbers.filter(num => num !== 1);

  const choices = [...nanValues, ...validNumbers];

  if (choices.length > 0) {
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    return edArray.findIndex(value => value === randomChoice || Number(value) === randomChoice) + 1;
  }

  return 1;
}

async function reactWithNumberEmoji(msg, number) {
  const emojiMap = {
    1: '1️⃣',
    2: '2️⃣',
    3: '3️⃣'
  };

  const emoji = emojiMap[number];
  if (emoji)
      await msg.react(emoji);
}

async function analyzeImage(url,l,t,w,h) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');

    const imagePath = 'temp_image.webp';
    fs.writeFileSync(imagePath, imageBuffer);

    const croppedImagePath = 'cropped_image.png';
    await sharp(imagePath) 
      .extract({ left: l, top: t, width: w, height: h })
      .toFile(croppedImagePath);

    const { data: { text } } = await tesseract.recognize(croppedImagePath, 'eng');

    fs.unlinkSync(imagePath);
    fs.unlinkSync(croppedImagePath);

    return text;
  } catch (error) {
    console.error('Error analyzing image:', error);
  }
}

async function waitForResponse(channel, timeout = 10000) {
  const filter = (response) => response.author.id !== channel.client.user.id;

  const fetchedMessages = await channel.awaitMessages({
      filter,
      max: 1,
      time: timeout,
      errors: ['time']
  }).catch(() => null);

  return fetchedMessages ? fetchedMessages.first() : null;
}

async function mainLoop(channel) {
  while (true) {
    if (shouldSendMessage(0.41)) {
      await channel.send('k!cd');
      await sleep(getRandomValue(612, 3230));
    }

    await channel.send('k!d');
    const msg = await waitForResponse(channel);

    if (msg) {
      const waitTimeMatch = msg.content.match(/(\d+) minutes/);
      if (waitTimeMatch) {
        const waitTime = parseInt(waitTimeMatch[1], 10);
        const waitTimeMs = waitTime * 60 * 1000;
        const ARG_time = new Date().toLocaleTimeString('es-AR');
        console.log(`${ARG_time}: Cooldown ${waitTime} minutes.`);
        await sleep(getRandomValue(waitTimeMs + 12123, waitTimeMs + 3 * 60 * 1000));
      } else {
        if (msg.attachments.size > 0) {
          await sleep(getRandomValue(1210, 3230));
          for (const attachment of msg.attachments.values()) {
            if (attachment.contentType && attachment.contentType.startsWith('image')) {
              const anime1 = await analyzeImage(attachment.url, 50, 300, 180, 60);
              const anime2 = await analyzeImage(attachment.url, 320, 300, 180, 60);
              const anime3 = await analyzeImage(attachment.url, 600, 300, 180, 60);

              const ARG_time = new Date().toLocaleTimeString('es-AR');
              const animes = `${anime1} - ${anime2} - ${anime3}`.replace(/\n/g, ' ');
              console.log(`${ARG_time}: ${animes}`);

              var num = checkForAnime(anime1, anime2, anime3);
              if (num != false) {
                reactWithNumberEmoji(msg, num);
              } else {
                const ed1 = await analyzeImage(attachment.url, 200, 370, 10, 10);
                const ed2 = await analyzeImage(attachment.url, 475, 370, 10, 10);
                const ed3 = await analyzeImage(attachment.url, 750, 370, 10, 10);

                const chosenEd = await getHighestOrRandom(ed1, ed2, ed3);
                reactWithNumberEmoji(msg, chosenEd);
              }
              break;
            }
          }
        }

        await waitForResponse(channel);
        await sleep(getRandomValue(2112, 4230));
        await channel.send('k!lu');
    
        const luMsg = await waitForResponse(channel);
        if (luMsg) 
          await extractAndSaveData(luMsg.embeds[0].description);
        
        await sleep(getRandomValue(MINS30 + 12123, MINS30 + 3 * 60 * 1000));
      }
    }
  }
}

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (channel) {
    mainLoop(channel)
  } else {
    console.log('Channel not found!');
  }
});

client.login(USER_TOKEN);