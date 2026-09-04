export const schemaValidation = (schema) => {
    return (req,res,next) => {
        const { error } = schema.validate(req.body, { allowUnknown: true, stripUnknown: true })
        if(error){
            return res.status(400).json({error: error.details[0].message})
        }
        next()
    }
}