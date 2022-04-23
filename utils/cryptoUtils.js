const crypto = require('crypto');


 const cryptoUtils = (target) => {
let cryptoPassWord = crypto.createHash('sha512').update(target).digest('base64')

return cryptoPassWord
}

module.exports = cryptoUtils;


