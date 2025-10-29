#!/usr/bin/env python3
"""
Backend API Testing for Character Class Selection System
Tests the 4-class character selection system (European, Dragon Ball Z, Jamaican, Sailor Moon)
"""

import requests
import json
import sys
from typing import Dict, Any, List

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    base_url = line.split('=', 1)[1].strip()
                    return f"{base_url}/api"
        return "http://localhost:8001/api"  # fallback
    except:
        return "http://localhost:8001/api"  # fallback

BASE_URL = get_backend_url()
print(f"Testing backend at: {BASE_URL}")

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def pass_test(self, test_name: str):
        self.passed += 1
        print(f"✅ PASS: {test_name}")
    
    def fail_test(self, test_name: str, error: str):
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        print(f"❌ FAIL: {test_name} - {error}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n=== TEST SUMMARY ===")
        print(f"Total Tests: {total}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        if self.errors:
            print(f"\nErrors:")
            for error in self.errors:
                print(f"  - {error}")
        return self.failed == 0

results = TestResults()

def test_health_check():
    """Test basic API health check"""
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Tropical Island Checkers API":
                results.pass_test("Health Check API")
                return True
            else:
                results.fail_test("Health Check API", f"Unexpected message: {data}")
                return False
        else:
            results.fail_test("Health Check API", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        results.fail_test("Health Check API", f"Exception: {str(e)}")
        return False

def test_create_room_with_class(mode: str = "american", player_name: str = "TestPlayer", red_class: str = "european"):
    """Test creating room with specific class parameter"""
    try:
        url = f"{BASE_URL}/create-room"
        params = {
            "mode": mode,
            "player_name": player_name,
            "red_class": red_class
        }
        
        response = requests.post(url, params=params)
        if response.status_code == 200:
            data = response.json()
            if "room_code" in data and len(data["room_code"]) == 6:
                results.pass_test(f"Create Room with {red_class} class")
                return data["room_code"]
            else:
                results.fail_test(f"Create Room with {red_class} class", f"Invalid room_code: {data}")
                return None
        else:
            results.fail_test(f"Create Room with {red_class} class", f"Status code: {response.status_code}")
            return None
    except Exception as e:
        results.fail_test(f"Create Room with {red_class} class", f"Exception: {str(e)}")
        return None

def test_get_room_state(room_code: str, expected_red_class: str = "european", expected_black_class: str = "european"):
    """Test getting room state and verify class information"""
    try:
        response = requests.get(f"{BASE_URL}/room/{room_code}")
        if response.status_code == 200:
            data = response.json()
            
            # Check if red_class and black_class fields exist
            if "red_class" not in data:
                results.fail_test(f"Get Room State - {room_code}", "Missing red_class field")
                return False
            
            if "black_class" not in data:
                results.fail_test(f"Get Room State - {room_code}", "Missing black_class field")
                return False
            
            # Verify class values
            if data["red_class"] != expected_red_class:
                results.fail_test(f"Get Room State - {room_code}", f"Expected red_class={expected_red_class}, got {data['red_class']}")
                return False
            
            if data["black_class"] != expected_black_class:
                results.fail_test(f"Get Room State - {room_code}", f"Expected black_class={expected_black_class}, got {data['black_class']}")
                return False
            
            results.pass_test(f"Get Room State with classes (red={expected_red_class}, black={expected_black_class})")
            return True
        else:
            results.fail_test(f"Get Room State - {room_code}", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        results.fail_test(f"Get Room State - {room_code}", f"Exception: {str(e)}")
        return False

def test_join_room_with_class(room_code: str, player_name: str = "TestPlayer2", black_class: str = "european"):
    """Test joining room with specific class parameter"""
    try:
        url = f"{BASE_URL}/join-room/{room_code}"
        params = {
            "player_name": player_name,
            "black_class": black_class
        }
        
        response = requests.post(url, params=params)
        if response.status_code == 200:
            data = response.json()
            if data.get("success") == True and "game_state" in data:
                # Verify the black_class was set correctly
                game_state = data["game_state"]
                if game_state.get("black_class") == black_class:
                    results.pass_test(f"Join Room with {black_class} class")
                    return True
                else:
                    results.fail_test(f"Join Room with {black_class} class", f"Expected black_class={black_class}, got {game_state.get('black_class')}")
                    return False
            else:
                results.fail_test(f"Join Room with {black_class} class", f"Unexpected response: {data}")
                return False
        else:
            results.fail_test(f"Join Room with {black_class} class", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        results.fail_test(f"Join Room with {black_class} class", f"Exception: {str(e)}")
        return False

def test_all_character_classes():
    """Test all 4 character classes for both red and black players"""
    classes = ["dbz", "jamaican", "european", "sailormoon"]
    
    print("\n=== Testing Create Room with All Classes ===")
    room_codes = {}
    
    # Test creating rooms with each class
    for class_name in classes:
        room_code = test_create_room_with_class(
            mode="american", 
            player_name=f"RedPlayer_{class_name}", 
            red_class=class_name
        )
        if room_code:
            room_codes[class_name] = room_code
            # Verify room state has correct red_class
            test_get_room_state(room_code, expected_red_class=class_name, expected_black_class="european")
    
    print("\n=== Testing Join Room with All Classes ===")
    # Test joining rooms with each class for black player
    for class_name in classes:
        if class_name in room_codes:
            room_code = room_codes[class_name]
            success = test_join_room_with_class(
                room_code, 
                player_name=f"BlackPlayer_{class_name}", 
                black_class=class_name
            )
            if success:
                # Verify final room state has both classes set correctly
                test_get_room_state(room_code, expected_red_class=class_name, expected_black_class=class_name)

def test_full_flow():
    """Test complete flow: Create room with european, join with jamaican"""
    print("\n=== Testing Full Flow ===")
    
    # Step 1: Create room with red_class='european'
    room_code = test_create_room_with_class(
        mode="american",
        player_name="EuropeanPlayer",
        red_class="european"
    )
    
    if not room_code:
        results.fail_test("Full Flow Test", "Failed to create room")
        return
    
    # Step 2: Verify room state has red_class='european' and black_class='european' (default)
    if not test_get_room_state(room_code, expected_red_class="european", expected_black_class="european"):
        results.fail_test("Full Flow Test", "Initial room state verification failed")
        return
    
    # Step 3: Join room with black_class='jamaican'
    if not test_join_room_with_class(room_code, player_name="JamaicanPlayer", black_class="jamaican"):
        results.fail_test("Full Flow Test", "Failed to join room with jamaican class")
        return
    
    # Step 4: Verify final room state has both classes correctly set
    if test_get_room_state(room_code, expected_red_class="european", expected_black_class="jamaican"):
        results.pass_test("Full Flow Test - Complete workflow")
    else:
        results.fail_test("Full Flow Test", "Final room state verification failed")

def test_default_class_behavior():
    """Test that default class is 'european' when not specified"""
    print("\n=== Testing Default Class Behavior ===")
    
    # Create room without specifying red_class (should default to european)
    try:
        url = f"{BASE_URL}/create-room"
        params = {
            "mode": "american",
            "player_name": "DefaultPlayer"
            # No red_class parameter
        }
        
        response = requests.post(url, params=params)
        if response.status_code == 200:
            data = response.json()
            room_code = data.get("room_code")
            if room_code:
                # Verify default class is european
                if test_get_room_state(room_code, expected_red_class="european", expected_black_class="european"):
                    results.pass_test("Default Class Behavior - red_class defaults to european")
                else:
                    results.fail_test("Default Class Behavior", "red_class did not default to european")
            else:
                results.fail_test("Default Class Behavior", "Failed to get room_code")
        else:
            results.fail_test("Default Class Behavior", f"Status code: {response.status_code}")
    except Exception as e:
        results.fail_test("Default Class Behavior", f"Exception: {str(e)}")

def main():
    print("=== CHARACTER CLASS SELECTION SYSTEM BACKEND TESTS ===\n")
    
    # Test basic connectivity first
    if not test_health_check():
        print("❌ Backend not accessible, stopping tests")
        return False
    
    # Test all character classes
    test_all_character_classes()
    
    # Test full workflow
    test_full_flow()
    
    # Test default behavior
    test_default_class_behavior()
    
    # Print summary
    success = results.summary()
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)