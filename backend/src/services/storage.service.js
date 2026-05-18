const { supabase } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const uploadToSupabase = async (file, bucket = process.env.SUPABASE_STORAGE_BUCKET || 'product-images') => {
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

module.exports = { uploadToSupabase };
