const sendResponse = async(res, success, data, message, statusCode) => {
    return res.status(statusCode).send({
        success: success,
        data: data,
        message : message
    })
}

module.exports = {
    sendResponse
}