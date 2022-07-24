
class APIFeatures {
    constructor(query,queryString){
      this.query=query;
      this.queryString=queryString;
    }
       
    filter() {
      const queryObj={...this.queryString}; //creating a new object that equals to the req.query object but not the same object
      const excludeFields=['sort','page','limit','fields'];
      excludeFields.forEach(el=>delete queryObj[el]);
      //advanced filtering
      let queryString=JSON.stringify(queryObj);
      queryString=queryString.replace(/\b(lt|lte|gt|gte)\b/g,match=>`$${match}`);
      this.query=this.query.find(JSON.parse(queryString));
      return this;
  }
  
  sort() {
    if (this.queryString.sort){
      const querySort=this.queryString.sort.split(',').join(' ');
      this.query=this.query.sort(querySort);
    } else {
      this.query=this.query.sort('-createdAt _id');; //default sort
    }  
    return this;
  }
  
  limitFields(){
    if (this.queryString.fields){
      const fieldsFilter=this.queryString.fields.split(',').join(' ');
      this.query=this.query.select(fieldsFilter);
    } else {
      this.query=this.query.select('-__v'); //remove __v field
    }
      return this;   
  }
  
  paginate(){
    const page=this.queryString.page *1 || 1;
    const limit=this.queryString.limit *1 || 100;
    const skip=(page-1)*limit;
   
    this.query=this.query.skip(skip).limit(limit);
    return this;
  }
  }  
  module.exports = APIFeatures;