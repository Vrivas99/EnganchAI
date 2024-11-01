import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from PIL import Image
import pandas as pd
import os
import time

# Define EngagementDataset
class EngagementDataset(Dataset):
    def __init__(self, csv_file, root_dir, transform=None):
        self.labels_frame = pd.read_csv(csv_file)
        self.root_dir = root_dir
        self.transform = transform

    def __len__(self):
        return len(self.labels_frame)

    def __getitem__(self, idx):
        img_path = self.labels_frame.iloc[idx, 0]
        image = Image.open(img_path).convert('RGB')
        
        # Extract the engagement label (assuming it's at column index 2)
        label = int(self.labels_frame.iloc[idx, 2])  # Engagement label
        
        if self.transform:
            image = self.transform(image)
        
        return image, torch.tensor(label, dtype=torch.long)

# Define CNN Model
class SimpleCNN(nn.Module):
    def __init__(self, num_classes=4):  # 4 classes for Engagement, Confusion, Boredom, Frustration
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 16, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(32 * 64 * 64, 512)  # Assuming image size is 256x256
        self.fc2 = nn.Linear(512, num_classes)

    def forward(self, x):
        x = self.pool(torch.relu(self.conv1(x)))
        x = self.pool(torch.relu(self.conv2(x)))
        x = x.view(-1, 32 * 64 * 64)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# Training function
def train_model(model, train_loader, num_epochs=10, learning_rate=0.001):
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    print(f'--Initializing EPOCHS--')
    for epoch in range(num_epochs):
        print(f'Epoch {epoch} starting')
        model.train()  # Set the model to training mode at the start of the epoch
        running_loss = 0.0
        correct = 0
        total = 0

        print(f'Total batches: {len(train_loader)}')
        start_time = time.time()  # Start timing the epoch

        for images, labels in train_loader:
            #print(f'First batch images shape: {images.shape}, labels shape: {labels.shape}')  
            images, labels = images.cuda(), labels.cuda()  # Move data to GPU

            optimizer.zero_grad()  # Zero the gradients
            outputs = model(images)  # Forward pass
            loss = criterion(outputs, labels)  # Compute loss
            loss.backward()  # Backpropagation
            optimizer.step()  # Update weights

            running_loss += loss.item()  # Accumulate loss
            _, predicted = torch.max(outputs, 1)  # Get predictions
            total += labels.size(0)  # Total samples
            correct += (predicted == labels).sum().item()  # Count correct predictions

        epoch_loss = running_loss / len(train_loader)  # Average loss for the epoch
        accuracy = 100 * correct / total  # Accuracy for the epoch

        end_time = time.time()  # End timing the epoch
        epoch_duration = end_time - start_time  # Duration of the epoch
        estimated_total_time = epoch_duration * (num_epochs - epoch - 1)  # Estimate remaining time

        # Print statistics for this epoch
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {epoch_loss:.4f}, Accuracy: {accuracy:.2f}%, "
              f"Time taken: {epoch_duration:.2f}s, Estimated remaining time: {estimated_total_time:.2f}s")

# Main script
if __name__ == '__main__':
    # File paths
    train_csv = '~/engagement_model_folder/lib/daisee/DAiSEE/Labels/framesTrainLabels.csv'
    root_dir = '~/engagement_model_folder/lib/daisee/DAiSEE/DataSet/Train'

    # Transformations (resizing and normalization)
    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    # Create dataset and dataloader
    train_dataset = EngagementDataset(csv_file=train_csv, root_dir=root_dir, transform=transform)
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=4)

    # Instantiate model, move it to GPU
    model = SimpleCNN(num_classes=4).cuda()

    # Train the model
    train_model(model, train_loader, num_epochs=10)
