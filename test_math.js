for (let i = 0; i < 10000; i += 0.01) {
    let faceValue = i;
    let advanceRequested = Math.floor(faceValue * 0.9);
    let invoiceAmount = Math.floor(faceValue);
    let max_advance = Math.floor((invoiceAmount * 90) / 100);
    if (advanceRequested > max_advance) {
        console.log('FAIL:', faceValue, 'advReq:', advanceRequested, 'invAmt:', invoiceAmount, 'max:', max_advance);
        break;
    }
}
