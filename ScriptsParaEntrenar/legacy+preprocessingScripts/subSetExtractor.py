import pandas as pd
import os
import shutil

def create_sample_dataset(csv_path, output_dir, sample_size=60000):
    # Read the CSV file
    df = pd.read_csv(csv_path)
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Shuffle the DataFrame and select a sample
    df_sample = df.sample(n=min(sample_size, len(df)), random_state=42)  # Use random_state for reproducibility
    
    # Create a new DataFrame for the sampled data
    sampled_data = df_sample[['ImagePath', 'Boredom', 'Engagement', 'Confusion', 'Frustration']].copy()
    
    # Loop through the selected sample and copy images to the output directory
    for index, row in df_sample.iterrows():
        image_path = row['ImagePath']
        # Get the file name and construct the output path
        file_name = os.path.basename(image_path)
        output_path = os.path.join(output_dir, file_name)
        
        # Copy the image to the new location
        shutil.copy(image_path, output_path)
    
    # Save the sampled data to a new CSV file
    sampled_data.to_csv(os.path.join(output_dir, 'sampled_labels.csv'), index=False)
    
    print(f'Sample dataset created with {len(df_sample)} images at {output_dir}')
    print(f'Sampled labels saved to {os.path.join(output_dir, "sampled_labels.csv")}')

# Example usage
csv_path = '/home/jocascript/engagement_model_folder/lib/daisee/DAiSEE/Labels/framesTrainLabels.csv'
output_dir = '/home/jocascript/engagement_model_folder/lib/daisee/DAiSEE/DataSet/SampleTrain'
create_sample_dataset(csv_path, output_dir)
