/**
 * BMI Command — Calculate Body Mass Index
 * Usage: .bmi <weight_kg> <height_cm>
 */
module.exports = {
    name: 'bmi',
    aliases: ['bodymass'],
    description: 'Calculate your Body Mass Index',
    category: 'utility',
    async execute({ reply, args }) {
        if (args.length < 2) return reply('⚖️ *BMI Calculator*\n\nUsage: .bmi <weight kg> <height cm>\nExample: .bmi 70 175');
        const weight = parseFloat(args[0]);
        const heightCm = parseFloat(args[1]);
        if (isNaN(weight) || isNaN(heightCm) || weight <= 0 || heightCm <= 0) return reply('❌ Please enter valid weight (kg) and height (cm).');
        const h = heightCm / 100;
        const bmi = (weight / (h * h)).toFixed(1);
        let category, emoji;
        if (bmi < 18.5) { category = 'Underweight'; emoji = '⚠️'; }
        else if (bmi < 25) { category = 'Normal Weight'; emoji = '✅'; }
        else if (bmi < 30) { category = 'Overweight'; emoji = '⚠️'; }
        else { category = 'Obese'; emoji = '🚨'; }
        reply(`⚖️ *BMI Calculator*\n\nWeight: ${weight} kg\nHeight: ${heightCm} cm\n\n📊 BMI: *${bmi}*\n${emoji} Category: *${category}*\n\n_Healthy BMI range: 18.5 – 24.9_`);
    }
};
