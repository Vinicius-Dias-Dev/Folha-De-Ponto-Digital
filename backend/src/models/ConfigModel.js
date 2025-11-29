import mongoose from "mongoose";

const ConfigSchema = new mongoose.Schema({
  assinaturaGestor: {
    type: String,
    default: "",
  },
});

export default mongoose.model("Config", ConfigSchema);
