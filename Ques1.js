// Add new item
app.post('/items', (req, res) => {
    const { name, description } = req.body;
    const newItem = { id: items.length + 1, name, description };
    items.push(newItem);
    res.status(201).json(newItem);
  });
  
 
  // Get item by ID 
  app.get('/items/:id', (req, res) => {
    const { id } = req.params;
    const item = items.find(i => i.id === parseInt(id));
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(item);
  });
  
  // Update item
  app.put('/items/:id', (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const item = items.find(i => i.id === parseInt(id));
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    item.name = name || item.name;
    item.description = description || item.description;
    res.status(200).json(item);
  });
  
  //  Delete item by ID
  app.delete('/items/:id', (req, res) => {
    const { id } = req.params;
    const index = items.findIndex(i => i.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }
    items.splice(index, 1);
    res.status(200).json({ message: 'Item deleted' });
  });