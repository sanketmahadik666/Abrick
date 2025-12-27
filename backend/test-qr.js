#!/usr/bin/env node

// Quick test script for QR code generation and scanning
const qrcode = require('qrcode');
const { toilets } = require('./models/storage');

console.log('🧪 QR Code Test Script');
console.log('======================\n');

// Generate a test QR code
async function testQRGeneration() {
    try {
        console.log('1. Testing QR Code Generation...');

        // Get first toilet from storage
        const allToilets = toilets.find({});
        if (allToilets.length === 0) {
            console.log('❌ No toilets found in storage. Please add some toilets first.');
            return;
        }

        const testToilet = allToilets[0];
        console.log(`📍 Using toilet: ${testToilet.name} (ID: ${testToilet.id})`);

        // Generate QR code URL
        const reviewUrl = `http://localhost:3000/review.html?id=${testToilet.id}`;
        console.log(`🔗 Generated URL: ${reviewUrl}`);

        // Generate QR code as ASCII for terminal display
        const qrCodeASCII = await qrcode.toString(reviewUrl, {
            type: 'terminal',
            errorCorrectionLevel: 'M'
        });

        console.log('\n📱 QR Code (ASCII):');
        console.log(qrCodeASCII);

        // Test URL parsing (what the frontend does)
        console.log('\n2. Testing URL Parsing...');
        try {
            const url = new URL(reviewUrl);
            const extractedId = url.searchParams.get('id');
            console.log(`✅ URL parsing successful`);
            console.log(`🆔 Extracted toilet ID: ${extractedId}`);
            console.log(`🔍 ID matches: ${extractedId === testToilet.id}`);
        } catch (parseError) {
            console.log(`❌ URL parsing failed: ${parseError.message}`);
        }

        console.log('\n📋 Test Instructions:');
        console.log('1. Start the server: npm run dev');
        console.log('2. Open: http://localhost:3000/review.html');
        console.log('3. Allow camera access');
        console.log('4. Point camera at this QR code or scan a real QR code');
        console.log('5. Check browser console for debug messages');

    } catch (error) {
        console.error('❌ QR Code test failed:', error.message);
    }
}

// Test storage
function testStorage() {
    console.log('\n3. Testing Storage...');
    const allToilets = toilets.find({});
    console.log(`📊 Total toilets in storage: ${allToilets.length}`);

    if (allToilets.length > 0) {
        console.log('🏢 Toilet types:');
        const types = {};
        allToilets.forEach(t => {
            types[t.type] = (types[t.type] || 0) + 1;
        });
        Object.entries(types).forEach(([type, count]) => {
            console.log(`   ${type}: ${count}`);
        });
    }
}

async function main() {
    testStorage();
    await testQRGeneration();

    console.log('\n✨ Test completed!');
    console.log('💡 Tip: Check browser console (F12) for detailed QR scanning logs');
}

main().catch(console.error);
