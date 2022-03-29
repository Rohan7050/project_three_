const moment = require("moment")
const mongoose = require("mongoose")
const bookModel = require("../model/bookModel")
const reviewModel = require("../model/reviewModel")
const userModel = require("../model/userModel")

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

let createBook = async function (req, res) {


    try {
        const requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, msg: 'please provide book details' })
            return
        }
        const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = requestBody
        if (!isValid(title)) {
            res.status(400).send({ status: false, message: 'book title is required' })
            return
        }
        if (!isValid(excerpt)) {
            res.status(400).send({ status: false, message: 'excerpt is required' })
            return
        }
        if (!isValid(userId)) {
            res.status(400).send({ status: false, message: 'user id is required' })
            return
        }
        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: '${userId} is not a valid userr id ' })
            return
        }
        if (!isValid(ISBN)) {
            res.status(400).send({ status: false, message: 'ISBN is required' })
            return
        }
        if (!isValid(category)) {
            res.status(400).send({ status: false, message: 'category is required' })
            return
        }
        if (!isValid(subcategory)) {
            res.status(400).send({ status: false, message: 'subcategory is required' })
            return
        }

        if (!isValid(releasedAt)) {
            res.status(400).send({ status: false, message: 'released date is required' })
            return
        }
        let user = await userModel.findById(userId)
        if (!user) {
            res.status(404).send({ status: false, msg: "user not found" })
        }

        let titleUsed = await bookModel.findOne({ title })
        if (titleUsed) {
            return res.status(400).send({ status: false, msg: "title already used" })
        }
        let IsbnUsed = await bookModel.findOne({ ISBN })
        if (IsbnUsed) {
            return res.status(400).send({ status: false, msg: "isbn already used" })
        }
        const newBook = await bookModel.create(requestBody)
        res.status(201).send({ status: true, data: newBook })
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

const getBook = async (req, res) => {
    // const filterKeys = ["userId", "category", "subcategory"]
    try{
        const data = req.query
        const filter = {
            isDeleted: false,
            ...data
        }
        const books = await bookModel.find(filter).select({"title": 1,"excerpt": 1,"userId": 1,"category":1,"reviews": 1,"releasedAt": 1})
        if(books.length === 0){
            return res.status(404).send({status: true, message: "no book founds"})
        }
        // if(books.length == 1){
        //     if(!filterKeys.includes(Object.keys(data)[0])){
        //         return res.status(404).send({status: true, message: `can not filter using (${Object.keys(data)[0]}) query`})
        //     }
        // }
        function compare( a, b ) {
            if ( a.title < b.title ){
              return -1;
            }
            if ( a.title > b.title ){
              return 1;
            }
            return 0;
          }
          
        books.sort( compare )
        return res.status(200).send({status: true, message: "Books list", data: books})
    }catch(e){
        return res.status(500).send({status: false, message: e.message})
    }
}


const getBooks = async (req, res) => {

    try {

        const data = req.params
        const id = data.bookId
        if(id.length === 0){
            return res.status(400).send({ error: "enter Book ID" })
        }

        const isPresent = await bookModel.findById({ _id: id })

        if (!isPresent) return res.status(404).send({ error: "Book not found" })

        const book = await bookModel.findOne({ _id: id, isDeleted: false }).select({isDeleted: 0})

        if (!book) return res.status(400).send({ error: "Book is deleted" })

        const reviews = await reviewModel.find({ bookId: id })
        
        const newBook = JSON.parse(JSON.stringify(book))
        newBook.reviewsData = [...reviews]
        // const obj = {
        //     _id: book._id,
        //     title: book.title,
        //     excerpt: book.excerpt,
        //     userId: book.userId,
        //     category: book.category,
        //     subcategory: book.subcategory,
        //     deleted: book.deleted,
        //     reviews: book.reviews,
        //     deletedAt: book.deletedAt,
        //     releasedAt: book.releasedAt,
        //     createdAt: book.createdAt,
        //     updatedAt: book.updatedAt,
        //     reviewsData: reviews
        // }

        res.status(200).send({ status: true, message: "Book list", data: newBook })
    }
    catch (err) {
        // console.log(err)
        res.status(500).send({ status: false, msg: err.message })
    }
}

const updateBook = async (req, res) => {

    try {
    let data = req.body
    const id = req.params.bookId

    const {title, ISBN} = data

    if (id.length === 0) {
        res.status(400).send(" Please enter book id ")
        return
    }

    if (!Object.keys(data).length > 0) return res.send({msg:"Please enter data for updation"})

    const bookPresent = await bookModel.findById({_id:id})

    if(!bookPresent) return  res.status(404).send({status:false, message:"Book not found"})

    let titleUsed = await bookModel.findOne({title})
    if (titleUsed) {
        return res.status(400).send({ status: false, msg: "title must be Unique" })
    }
    let IsbnUsed = await bookModel.findOne({ISBN})
    if (IsbnUsed) {
        return res.status(400).send({ status: false, msg: "isbn must be unique" })
    }

    if(data.isDeleted==true){
        data.deletedAt = moment().format("YYYY-MM-DD")
    }
    const updates = { ...data}

    const update = await bookModel.findOneAndUpdate({ _id: id, isDeleted:false }, { $set: updates }, { new: true })

    if(!update) return res.status(400).send({status:false, message:"Book is Deleted"})

    res.status(200).send({status:true, message: update })
}
catch(e){
    return res.status(500).send({ status: false, msg: e.message })
}
}

const deleteBook = async(req, res) => {
    try{
        const {bookId} = req.params
        if(!bookId){
            return res.status(404).send({ status: false, message: "enter book id" })
        }
        const book = await bookModel.findById(bookId)
        if (!book){
            return res.status(404).send({status: false, message: "Book not found" })
        }
        if (book.isDeleted == true){
            return res.status(404).send({status: false, message: "Book is already deleted" })
        }
        const delBook = await bookModel.findByIdAndUpdate(bookId, {isDeleted: true, deletedAt: moment().format("YYYY-MM-DD")}, {new: true})
        return res.status(200).send({status: true, data: delBook})
    }catch(e){
        return res.status(500).send({ status: false, msg: e.message })
    }
}

module.exports.getBook = getBook;
module.exports.getBooks = getBooks
module.exports.createBook = createBook;
module.exports.updateBook = updateBook;
module.exports.deleteBook = deleteBook



