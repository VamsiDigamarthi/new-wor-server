import BannersModel from "../Modals/BannerModal.js";
import BannerOffersModel from "../Modals/BannerOffersModal.js";
import CitiesModel from "../Modals/CitiesModal.js";
import OrderModel from "../Modals/OrderModal.js";
import UserModel from "../Modals/UserModal.js";
import bcrypt from "bcrypt";

export const onPostBanners = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please Send Image file...!" });
    }

    const banner = new BannersModel({
      bannerImage: req.file.path,
    });
    await banner.save();

    return res.status(201).json({ message: "Banner added successfully...!" });
  } catch (error) {
    console.error("Banners post Faield", error);
    return res
      .status(500)
      .json({ message: "Banners post Faield", error: error.message });
  }
};

export const onPostBannersOffer = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please Send Image file...!" });
    }

    const banner = new BannerOffersModel({
      bannerImage: req.file.path,
      title: req.body.title,
      subTitle: req.body.subTitle,
    });
    await banner.save();

    return res
      .status(201)
      .json({ message: "Banner Offers added successfully...!" });
  } catch (error) {
    console.error("Banners post Faield", error);
    return res
      .status(500)
      .json({ message: "Banners post Faield", error: error.message });
  }
};

export const onFetchAllBanners = async (req, res) => {
  try {
    const banners = await BannersModel.find({}).select("bannerImage");
    return res.status(200).json(banners);
  } catch (error) {
    console.error("Banners get Faield", error);
    return res
      .status(500)
      .json({ message: "Banners get Faield", error: error.message });
  }
};

export const onDeleteAllOrders = async (req, res) => {
  try {
    await OrderModel.deleteMany({});
    return res.status(204).json({ message: "All Orders Deleted...!" });
  } catch (error) {
    console.error("All orders Deleted failed", error);
    return res
      .status(500)
      .json({ message: "All orders Deleted failed", error: error.message });
  }
};

export const onDeleteOneCaptaine = async (req, res) => {
  const { captainId } = req.params;
  try {
    await UserModel.deleteOne({ _id: captainId, role: "captain" });

    return res.status(204).json({ message: "Delete One Captaine...!" });
  } catch (error) {
    console.error("Delete One Captaine failed", error);
    return res
      .status(500)
      .json({ message: "Delete One Captaine failed", error: error.message });
  }
};

export const onDeleteUser = async (req, res) => {
  const { mobile } = req.body;
  try {
    await UserModel.deleteOne({ mobile });

    return res.status(200).json({ message: "deleted....!" });
  } catch (error) {
    console.error("Holding Captaine failed", error);
    return res
      .status(500)
      .json({ message: "Holding Captaine failed", error: error.message });
  }
};

export const onAddCities = async (req, res) => {
  try {
    const docs = {
      cities: req.body,
    };

    const citi = new CitiesModel(docs);

    await citi.save();

    return res.status(200).json({ message: "Cities added successfully...!" });
  } catch (error) {
    console.error("Add Cities Failed", error);
    return res
      .status(500)
      .json({ message: "Add Cities Failed", error: error.message });
  }
};

export const onAdminRegister = async (req, res) => {
  const { name, email, password, mobile } = req.body;

  // Check if the email already exists
  const existingAdmin = await UserModel.findOne({ email });
  if (existingAdmin) {
    return res.status(400).json({ message: "Mobile is already in use" });
  }

  try {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPassword = bcrypt.hashSync(password, salt);

    // Create new admin
    const newAdmin = new UserModel({
      name,
      email,
      mobile,
      role: "admin",
      password: hashPassword, // Save the hashed password
    });

    await newAdmin.save();
    return res.status(201).json({
      message: "Admin registered successfully",
    });
  } catch (error) {
    console.log({ error: error.message, message: "Admin registration failed" });
    return res
      .status(500)
      .json({ message: "Admin registration failed", error: error.message });
  }
};

export const onVerificationOfUser = async (req, res) => {
  const { mobile } = req.params;
  try {
    const user = await UserModel.findOneAndUpdate(
      { mobile },
      { $set: { userVerified: true } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User verified successfully" });
  } catch (error) {
    console.log({ error: error.message, message: "Verification Failed" });
    return res.status(500).json({
      message: "Verification Failed",
      error: error.message,
    });
  }
};
