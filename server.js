const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8080; // Azure requires port 8080
var corsOptions : {optionsSuccessStatus: number, origin: string} = { origin = '*', optionSuccessStatus: 200 }
// Middleware to parse JSON request body
app.use(bodyParser.json());

// API route to calculate risk based on user inputs
app.post('/calculate-risk', (req, res) => {
    let { age, weight, height, bloodPressure, familyHistory, units } = req.body;

    // Validate inputs
    if (!age || !weight || !height || !bloodPressure || !familyHistory || !units) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Convert weight and height if units are US
    if (units === 'us') {
        weight = weight / 2.20462; // Convert lbs to kg
        height = height * 2.54; // Convert inches to cm
    }

    // BMI Calculation (using metric units)
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    let bmiCategory = bmi >= 30 ? 'obese' : bmi >= 25 ? 'overweight' : 'normal';

    // Age-based points
    let agePoints = age < 30 ? 0 : age < 45 ? 10 : age < 60 ? 20 : 30;

    // Blood Pressure-based points
    const bpPoints = {
        normal: 0,
        elevated: 15,
        stage1: 30,
        stage2: 75,
        crisis: 100
    }[bloodPressure] || 0;

    // Family History-based points
    let familyHistoryPoints = (familyHistory && familyHistory.length > 0 && familyHistory[0] !== "none")
        ? 10 * familyHistory.length
        : 0;

    // Calculate total risk score
    const totalRiskScore = agePoints + (bmiCategory === 'normal' ? 0 : bmiCategory === 'overweight' ? 30 : 75) + bpPoints + familyHistoryPoints;

    // Determine risk category
    let riskCategory = totalRiskScore <= 50 ? 'moderate risk' : totalRiskScore <= 75 ? 'high risk' : 'uninsurable';

    // Send response
    res.json({
        bmiCategory,
        bpCategory: bloodPressure,
        riskScore: totalRiskScore,
        riskCategory
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
