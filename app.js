
const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

// const items = ["Buy food", "Cook food", "Eat food"];
const workItems= [];

mongoose.connect("mongodb+srv://admin-dishu:test123@cluster0.hjbj5.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

const item1  = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + to add a new item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultitems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
  // const day = date.getDate();

  Item.find({}, function(err, founditems){
    if(founditems.length === 0){
      Item.insertMany(defaultitems, function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Successfully saved item to DB");
        }
        res.redirect("/");
      });
    }
    else{
      res.render("list", {ListTitle: "Today", newListItems: founditems});
    }
  })
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultitems
        });
        list.save();
        res.redirect("/" + customListName);
      }else{
        //show an existing list
        res.render("list", {ListTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if(listName == "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/work", function(req, res){
  res.render("list", {ListTitle: "Work List", newListItems: workItems})
});

app.post("/work", function(req, res){
  let item = req.body.newItem;
  workItems.push(item);
  res.redirect("/work");
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
  console.log("Server has started Successfully");
})
