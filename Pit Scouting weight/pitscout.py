import pandas as pd

def load_and_process_data(file_path):
    df = pd.read_csv(file_path)
    
    print(df.columns)  # for debugging to check actual column names

    team_col = next((col for col in df.columns if "Team" in col), None)

    if not team_col:
        raise ValueError("Could not find a column containing 'Team' in its name. Please check your CSV file.")

        
    # Data values
    df_cleaned = df[[
        team_col, "Weight", "topHeavy",
        "coralConfident",
        "algaeConfident",
        "autoalignQuality"
    ]].copy()

    # Rename columns for clarity
    df_cleaned.columns = ["Team", "Weight", "Top_Heavy", "Coral_Confidence", "Algae_Confidence", "Auto_Align"]

    # Number -> float
    for col in ["Weight", "Top_Heavy", "Coral_Confidence", "Algae_Confidence", "Auto_Align"]:
        df_cleaned[col] = pd.to_numeric(df_cleaned[col], errors='coerce')

    df_cleaned["Team_Number"] = df_cleaned["Team"].str.extract(r'(\d+)').astype(float)
    
    # No team number? buh bye!
    df_cleaned = df_cleaned.dropna(subset=["Team_Number"]).set_index("Team_Number")

    # Weight value
    weights = {
        "Weight": 1,
        "Top_Heavy": -2,  # Negative because more top-heavy is worse
        "Coral_Confidence": 5,
        "Algae_Confidence": 4,
        "Auto_Align": 3
    }

    # erm lemme whip out the calc
    df_cleaned["Score"] = (
        df_cleaned["Weight"] * weights["Weight"] +
        df_cleaned["Top_Heavy"] * weights["Top_Heavy"] +
        df_cleaned["Coral_Confidence"] * weights["Coral_Confidence"] +
        df_cleaned["Algae_Confidence"] * weights["Algae_Confidence"] +
        df_cleaned["Auto_Align"] * weights["Auto_Align"]
    )
    
    return df_cleaned

def get_team_score(df, team_number):
    try:
        team_number = float(team_number)  
        print(f"Requested Team Number: {team_number}")
        print("Available team numbers in the index:", df.index.tolist()) #I forget what teams there are waaaaaayy too often
        
        # Get the team data
        team_data = df.loc[team_number]
        
    
        top_heavy_score = team_data["Top_Heavy"] * -2  
        coral_confident_score = team_data["Coral_Confidence"] * 5  
        algae_confident_score = team_data["Algae_Confidence"] * 4  
        auto_align_score = team_data["Auto_Align"] * 3  
        
        
        total_score = top_heavy_score + coral_confident_score + algae_confident_score + auto_align_score
        
        # Print scores
        return (
            f"Team {int(team_number)}'s Scores Breakdown:\n"
            f"Top Heavy Score: {top_heavy_score:.2f}\n"
            f"Coral Confidence Score: {coral_confident_score:.2f}\n"
            f"Algae Confidence Score: {algae_confident_score:.2f}\n"
            f"Auto Align Score: {auto_align_score:.2f}\n"
            f"Total Score: {total_score:.2f}"
        )
        
    except KeyError:
        return f"Team {int(team_number)} not found in the dataset." #key errors are the BANE OF MY GODDAMN EXISTENCE. 






if __name__ == "__main__":
    file_path = "pitscout.csv"  # Update if needed
    df_processed = load_and_process_data(file_path)
    
    # Example: Get score for a specific team
    team_number = float(input("Enter Team Number: "))
    print(get_team_score(df_processed, team_number))