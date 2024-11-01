"""
input -> dataframe of pandas
"""
import numpy as np

def simplify_labels(df):
  # Labels
  label_columns = ['Boredom','Engagement','Confusion','Frustration']
  for i, row in df.iterrows():
    max_value = row[label_columns].max()
    max_indices = row[label_columns][row[label_columns]==max_value].index.tolist()

    # Seleccion Random si existen valores similares
    chosen_label = np.random.choice(max_indices)
    # Set 0 para el resto
    df.loc[i,label_columns]=[1 if col == chosen_label else 0 for col in label_columns]
  return df