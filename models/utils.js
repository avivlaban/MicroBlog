

const regexIdValidationForDB = '/^[0-9a-fA-F]{24}$/';

module.exports.validateIdFormat = function validateIdFormat(id){
    if (id.match(regexIdValidationForDB)) {
        return true;
    }else{
        return false;
    }
}