const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

/******** UTILS  ********/
function createResponse(response, data, errorMessage) {
  var errorGeneric = "An error ocurred";
  if (response) {
    if (data) {
      if (data.success) {
        return response.status(data.status).json(data.data);
      } else {
        var error = (data.message) ? data.message : errorGeneric;
        return response.status(data.status).json({ error });
      }
    }
    var error = (errorMessage) ? errorMessage : errorGeneric;
    return response.status(500).json({ error });
  }
  return null;
}

function createError(status, message) {
  return {
    status: status,
    success: false,
    message
  }
}

function createSuccess(status, data) {
  return {
    status: status,
    success: true,
    data
  }
}

function insertUser(name, username) {
  if (name && username) {
    let findByUsername = findUserByUsername(username);
    if (!findByUsername) {
      let newUser = { id: uuidv4(), name, username, todos: [] };
      users.push(newUser);
      return createSuccess(201, newUser);
    }
    return createError(400, `Already exists a user with username ${username}`);
  }
  return createError(400, "Name and Username are required");
}

function findTodoById(user, id) {
  if (user)
    return user.todos.find(t => t.id === id);

  return null;
}

function insertTodo(user, title, deadline) {
  if (user) {
    if (!user.todos)
      user.todos = new Array();

    let newTodo = {
      id: uuidv4(),
      title,
      done: false,
      deadline: new Date(deadline),
      created_at: new Date()
    };
    user.todos.push(newTodo);
    return createSuccess(201, newTodo);
  }
  return createError(400, "Title and Deadline are required");
}

function updateTodo(user, id, newTitle, newDeadline) {
  if (user && id && newTitle && newDeadline) {
    const currentTodo = user.todos.find(t => t.id === id);
    if (currentTodo) {
      const filtered = user.todos.filter(t => t.id !== id);
      currentTodo.title = newTitle;
      currentTodo.deadline = new Date(newDeadline);
      filtered.push(currentTodo);
      user.todos = filtered;
      return createSuccess(200, currentTodo);
    } else {
      return createError(404, `${id} not found`);
    }
  } else {
    return createError(400, "Invalid parameters");
  }
}

function doneTodo(user, id) {
  if (user && id) {
    const currentTodo = findTodoById(user, id);
    if (currentTodo) {
      currentTodo.done = true;
      const filtered = user.todos.filter(t => t.id !== id);
      filtered.push(currentTodo);
      user.todos = filtered;
      return createSuccess(200, currentTodo);
    } else {
      return createError(404, `${id} not found`);
    }
  } else {
    return createError(400, "Invalid parameters");
  }
}

function deleteTodo(user, id) {
  if (user && id) {
    const currentTodo = findTodoById(user, id);
    if (currentTodo) {
      const filtered = user.todos.filter(t => t.id !== id);
      user.todos = filtered;
      return createSuccess(204, null);
    } else {
      return createError(404, 'Todo not found');
    }
  }
  return createError(400, "Invalid parameters");
}

function findUserByUsername(username) {
  if (username) {
    return users.find(current => current.username === username);
  }
  return null;
}

/******** FIM UTILS ********/




/******** MIDDLEWARE  ********/
function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  if (username) {
    const user = findUserByUsername(username);
    if (user) {
      request.user = user;
      next();
    } else {
      return response.status(401).json({ error: "User not found" });
    }
  } else {
    return response.status(401).json({ error: "Username is required on header" });
  }
}



/******** REST API'S  ********/
app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const insertedUser = insertUser(name, username);
  const retorno = createResponse(response, insertedUser);
  return retorno;
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const insertedTodo = insertTodo(user, title, deadline);
  const retorno = createResponse(response, insertedTodo);
  return retorno;
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const { id } = request.params;
  const updatedTodo = updateTodo(user, id, title, deadline);
  const retorno = createResponse(response, updatedTodo);
  return retorno;
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;
  const doneTodoRetorno = doneTodo(user, id);
  const retorno = createResponse(response, doneTodoRetorno);
  return retorno;
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;
  const deleted = deleteTodo(user, id);
  const retorno = createResponse(response, deleted);
  return retorno;
});

module.exports = app;