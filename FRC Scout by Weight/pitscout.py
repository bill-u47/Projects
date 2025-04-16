import pandas as pd
import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk

def read_csv_files(blue_file, red_file):
    try:
        blue_data = pd.read_csv(blue_file)
        red_data = pd.read_csv(red_file)
        print("Successfully read CSV files")
        return blue_data, red_data
    except Exception as e:
        print(f"Error reading CSV files: {e}")
        return None, None

def load_subjective_weights(csv_path):
    """
    Load subjective weights from the pitscout.csv file
    """
    try:
        # Read the CSV file
        df = pd.read_csv(csv_path)
        
        # Create a dictionary to store team weights
        team_weights = {}
        
        # Extract relevant columns
        for _, row in df.iterrows():
            # Extract team number, removing any non-numeric characters
            team_number = int(''.join(filter(str.isdigit, str(row['Team']))))
            
            # Collect subjective weights
            weights = {
                'Weight': row['Weight'] if pd.notna(row['Weight']) else 5,
                'Top_Heavy': row['topHeavy'] if pd.notna(row['topHeavy']) else 2,
                'Coral_Confidence': row['coralConfident'] if pd.notna(row['coralConfident']) else 3,
                'Algae_Confidence': row['algaeConfident'] if pd.notna(row['algaeConfident']) else 2,
                'Auto_Align': row['autoalignQuality'] if pd.notna(row['autoalignQuality']) else 3
            }
            
            team_weights[team_number] = weights
        
        return team_weights
    
    except Exception as e:
        print(f"Error loading subjective weights: {e}")
        return {}

def analyze_data(blue_data, red_data, subjective_weights):
    try:
        # Combine the data
        all_data = pd.concat([blue_data, red_data])
        
        # Print basic info
        print(f"Total number of records: {len(all_data)}")
        print(f"Number of teams: {all_data['Team Number'].nunique()}")
        
        # Convert boolean columns to integers
        bool_cols = all_data.select_dtypes(include=['bool']).columns
        for col in bool_cols:
            all_data[col] = all_data[col].astype(int)
        
        # Calculate coral and algae scores
        all_data['Coral_Score'] = all_data.iloc[:, 6] + all_data.iloc[:, 7] + all_data.iloc[:, 8] + \
                                all_data.iloc[:, 12] + all_data.iloc[:, 13] + all_data.iloc[:, 14]
        
        all_data['Algae_Score'] = all_data.iloc[:, 10] + all_data.iloc[:, 11] + \
                                all_data.iloc[:, 16] + all_data.iloc[:, 17]
        
        # Group by team
        team_stats = all_data.groupby('Team Number').agg({
            'Coral_Score': 'mean',
            'Algae_Score': 'mean',
            'Tipped': 'mean',
            'Died': 'mean'
        })
        
        # Calculate stability
        team_stats['Stability'] = 1 - (team_stats['Tipped'] + team_stats['Died'])/2
        
        # Add subjective weights and scores
        team_stats['Predicted_Weights'] = team_stats.index.map(lambda x: calculate_subjective_score(x, team_stats, subjective_weights))
        
        # Add total weighted score
        team_stats['Total_Weighted_Score'] = team_stats.apply(
           lambda row: 
           calculate_total_weighted_score(row.name, team_stats, subjective_weights), 
            axis=1
        )
        # Sort by total weighted score
        team_stats = team_stats.sort_values('Total_Weighted_Score', ascending=False)
        
        return team_stats
    
    except Exception as e:
        print(f"Error analyzing data: {e}")
        return None

def calculate_total_weighted_score(team_number, team_stats, subjective_weights):
    """
    Calculate total weighted score based on:
    - Coral and algae scoring with multipliers
    - Penalties for tipping and dying
    - Stability bonus
    """
    try:
        # Get subjective weights for this team
        weights = subjective_weights.get(team_number, {
            'Coral_Confidence': 5,  # Default multiplier for coral
            'Algae_Confidence': 4,  # Default multiplier for algae
        })
        
        # Get team's performance metrics
        coral_score = team_stats.loc[team_number, 'Coral_Score']
        algae_score = team_stats.loc[team_number, 'Algae_Score']
        tipped = team_stats.loc[team_number, 'Tipped']
        died = team_stats.loc[team_number, 'Died']
        stability = team_stats.loc[team_number, 'Stability']
        
        # Calculate weighted scoring
        coral_weighted_score = coral_score * weights.get('Coral_Confidence', 5)
        algae_weighted_score = algae_score * weights.get('Algae_Confidence', 4)
        
        # Calculate penalties and bonuses
        tipping_penalty = tipped * -2  # Penalty for tipping
        dying_penalty = died * -5     # Severe penalty for dying
        stability_bonus = stability * 3  # Bonus for stability
        
        # Total weighted score
        total_score = (
            coral_weighted_score + 
            algae_weighted_score + 
            tipping_penalty + 
            dying_penalty + 
            stability_bonus
        )
        
        return total_score
    
    except Exception as e:
        print(f"Error calculating total score for team {team_number}: {e}")
        return 0
        
def calculate_subjective_score(team_number, team_stats, subjective_weights):
    """
    Calculate a score based on subjective weights and match performance
    """
    try:
        # Get subjective weights for this team
        weights = subjective_weights.get(team_number, {
            'Top_Heavy': -2,
            'Coral_Confidence': 5,
            'Algae_Confidence': 4,
            'Auto_Align': 3
        })
        # Normalize performance metrics
        max_coral = team_stats['Coral_Score'].max()
        max_algae = team_stats['Algae_Score'].max()
        
        # Calculate normalized scores
        coral_score = (team_stats.loc[team_number, 'Coral_Score'] / max_coral * 10) if max_coral > 0 else 0
        algae_score = (team_stats.loc[team_number, 'Algae_Score'] / max_algae * 10) if max_algae > 0 else 0
        stability = team_stats.loc[team_number, 'Stability'] * 10
        
        # Calculate weighted score
        score = (
            weights.get('Weight', 5) * 1 +
            (10 - stability) * weights.get('Top_Heavy', 2) * -1 +
            coral_score * weights.get('Coral_Confidence', 3) +
            algae_score * weights.get('Algae_Confidence', 2) +
            weights.get('Auto_Align', 3) * 3
        )
        return score
    
    except Exception as e:
        print(f"Error calculating score for team {team_number}: {e}")
        return 0
def calculate_total_weighted_score(team_number, team_stats, subjective_weights):
    """
    Calculate total weighted score based on:
    - Coral and algae scoring with multipliers
    - Penalties for tipping and dying
    - Stability bonus
    """
    try:
        # Get subjective weights for this team
        weights = subjective_weights.get(team_number, {
            'Coral_Confidence': 5,  # Default multiplier for coral
            'Algae_Confidence': 4,  # Default multiplier for algae
        })
        
        # Get team's performance metrics
        coral_score = team_stats.loc[team_number, 'Coral_Score']
        algae_score = team_stats.loc[team_number, 'Algae_Score']
        tipped = team_stats.loc[team_number, 'Tipped']
        died = team_stats.loc[team_number, 'Died']
        stability = team_stats.loc[team_number, 'Stability']
        
        # Calculate weighted scoring
        coral_weighted_score = coral_score * weights.get('Coral_Confidence', 5)
        algae_weighted_score = algae_score * weights.get('Algae_Confidence', 4)
        
        # Calculate penalties and bonuses
        tipping_penalty = tipped * -2  # Penalty for tipping
        dying_penalty = died * -5     # Severe penalty for dying
        stability_bonus = stability * 3  # Bonus for stability
        
        # Total weighted score
        total_score = (
            coral_weighted_score + 
            algae_weighted_score + 
            tipping_penalty + 
            dying_penalty + 
            stability_bonus
        )
        
        return total_score
    
    except Exception as e:
        print(f"Error calculating total score for team {team_number}: {e}")
        return total_score
    
def main():
    try:
        # File paths
        blue_file = "2025 Colorado public - Blue Robot Input.csv"
        red_file = "2025 Colorado public - Red Robot Input.csv"
        subjective_weights_file = "pitscout.csv"
        
        # Load subjective weights
        print("Loading subjective weights...")
        subjective_weights = load_subjective_weights(subjective_weights_file)
        
        # Read data
        print("Reading CSV files...")
        blue_data, red_data = read_csv_files(blue_file, red_file)
        if blue_data is None or red_data is None:
            return
        
        # Analyze data
        print("\nAnalyzing data...")
        team_stats = analyze_data(blue_data, red_data, subjective_weights)
        if team_stats is None:
            return
        
        
            
        # Print team stats
        print("\n--- TEAM STATISTICS WITH PREDICTED WEIGHTS ---")
        print(team_stats)
        
    except Exception as e:
        print(f"Error in main function: {e}")

class RobotScoutingApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Robot Scouting Tool")
        self.root.geometry("1000x800")

        # Create a frame for file selection
        file_frame = tk.Frame(root)
        file_frame.pack(padx=10, pady=10, fill='x')

        # Blue Alliance CSV
        tk.Label(file_frame, text="Blue Alliance CSV:").grid(row=0, column=0, sticky='w')
        self.blue_file_entry = tk.Entry(file_frame, width=50)
        self.blue_file_entry.grid(row=0, column=1, padx=5, pady=5)
        self.blue_file_button = tk.Button(file_frame, text="Browse", command=self.select_blue_file)
        self.blue_file_button.grid(row=0, column=2, padx=5, pady=5)
        self.blue_file_checkmark = tk.Label(file_frame, text="")
        self.blue_file_checkmark.grid(row=0, column=3, padx=5)

        # Red Alliance CSV
        tk.Label(file_frame, text="Red Alliance CSV:").grid(row=1, column=0, sticky='w')
        self.red_file_entry = tk.Entry(file_frame, width=50)
        self.red_file_entry.grid(row=1, column=1, padx=5, pady=5)
        self.red_file_button = tk.Button(file_frame, text="Browse", command=self.select_red_file)
        self.red_file_button.grid(row=1, column=2, padx=5, pady=5)
        self.red_file_checkmark = tk.Label(file_frame, text="")
        self.red_file_checkmark.grid(row=1, column=3, padx=5)

        # Subjective Weights CSV
        tk.Label(file_frame, text="Subjective Weights CSV:").grid(row=2, column=0, sticky='w')
        self.subjective_file_entry = tk.Entry(file_frame, width=50)
        self.subjective_file_entry.grid(row=2, column=1, padx=5, pady=5)
        self.subjective_file_button = tk.Button(file_frame, text="Browse", command=self.select_subjective_file)
        self.subjective_file_button.grid(row=2, column=2, padx=5, pady=5)
        self.subjective_file_checkmark = tk.Label(file_frame, text="")
        self.subjective_file_checkmark.grid(row=2, column=3, padx=5)

        # Analyze button
        self.analyze_button = tk.Button(root, text="Analyze Data", command=self.analyze_data)
        self.analyze_button.pack(pady=20)

        # Results text area
        self.results_text = tk.Text(root, height=30, width=200)
        self.results_text.pack()

        # File path storage
        self.blue_file_path = ""
        self.red_file_path = ""
        self.subjective_file_path = ""

        # Create green checkmark
        try:
            self.checkmark_image = ImageTk.PhotoImage(Image.open("green_checkmark.png").resize((20, 20)))
        except:
            # Fallback to text if image can't be loaded
            self.checkmark_image = None

    def show_checkmark(self, checkmark_label):
        if self.checkmark_image:
            checkmark_label.config(image=self.checkmark_image)
        else:
            checkmark_label.config(text="✓", fg="green", font=("Arial", 16))

    def select_blue_file(self):
        self.blue_file_path = filedialog.askopenfilename(title="Select Blue Alliance CSV", filetypes=[("CSV files", "*.csv")])
        if self.blue_file_path:
            self.blue_file_entry.delete(0, tk.END)
            self.blue_file_entry.insert(0, self.blue_file_path)
            self.show_checkmark(self.blue_file_checkmark)

    def select_red_file(self):
        self.red_file_path = filedialog.askopenfilename(title="Select Red Alliance CSV", filetypes=[("CSV files", "*.csv")])
        if self.red_file_path:
            self.red_file_entry.delete(0, tk.END)
            self.red_file_entry.insert(0, self.red_file_path)
            self.show_checkmark(self.red_file_checkmark)

    def select_subjective_file(self):
        self.subjective_file_path = filedialog.askopenfilename(title="Select Subjective Weights CSV", filetypes=[("CSV files", "*.csv")])
        if self.subjective_file_path:
            self.subjective_file_entry.delete(0, tk.END)
            self.subjective_file_entry.insert(0, self.subjective_file_path)
            self.show_checkmark(self.subjective_file_checkmark)

    def analyze_data(self):
        # Verify all files are selected
        if not (self.blue_file_path and self.red_file_path and self.subjective_file_path):
            messagebox.showerror("Error", "Please select all CSV files")
            return

        try:
            # Load subjective weights
            subjective_weights = load_subjective_weights(self.subjective_file_path)
            
            # Read data
            blue_data = pd.read_csv(self.blue_file_path)
            red_data = pd.read_csv(self.red_file_path)

            # Analyze data
            team_stats = analyze_data(blue_data, red_data, subjective_weights)

            # Display results
            self.results_text.delete(1.0, tk.END)
            self.results_text.insert(tk.END, str(team_stats))

        except Exception as e:
            messagebox.showerror("Analysis Error", str(e))

def main():
    root = tk.Tk()
    app = RobotScoutingApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()