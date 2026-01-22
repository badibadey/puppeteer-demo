const { humanDelay } = require('../lib/human-behavior');

console.log('Testing human-behavior.js...');

const delayTypes = ['betweenActions', 'beforeScroll', 'afterPageLoad', 'typingSpeed', 'readingTime'];

delayTypes.forEach(type => {
    const delay = humanDelay(type);
    console.log(`Delay for ${type}: ${delay}ms`);
    if (typeof delay !== 'number' || delay <= 0) {
        console.error('❌ Invalid delay generation!');
        process.exit(1);
    }
});

console.log('✅ human-behavior.js imports work correctly.');
