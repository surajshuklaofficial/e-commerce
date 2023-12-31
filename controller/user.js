import User from '../model/user.js';

export const fetchUserById = async (req, res) => {
  const { id } = req.user;
  try {
    let user = await User.findById(id);

    // removing critical info
    user = {email: user.email, role: user.role, addresses: user.addresses, orders: user.orders}
    
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json(err);
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.user;
  try {
    const user = await User.findByIdAndUpdate(id, req.body, { new: true });
    //TODO: remove critical information
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json(err);
  }
};