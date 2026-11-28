"""Regressions for saving a localized public roster."""
import copy
import unittest

from refresh import ALLY_CODE, validate_dashboard


class RosterValidationTests(unittest.TestCase):
    def setUp(self):
        self.catalog = {"STAP": {"name": "STAP", "combatType": 1}}
        self.view = {"allyCode": ALLY_CODE, "refreshedAt": "2026-11-28T11:35:05Z",
                     "units": [{"id": "STAP", "name": "STAP", "type": "Character"}]}

    def test_official_name_can_equal_game_id(self):
        validate_dashboard(self.view, self.catalog, min_units=1)

    def test_fallback_id_without_a_localized_definition_is_rejected(self):
        for catalog in [{}, {"STAP": {"name": "", "combatType": 1}}]:
            with self.subTest(catalog=catalog), self.assertRaises(ValueError):
                validate_dashboard(self.view, catalog, min_units=1)

    def test_mismatched_name_type_account_and_duplicates_are_rejected(self):
        for patch in [{"name": "Fallback name"}, {"type": "Unknown"}, {"type": "Ship"}]:
            view = copy.deepcopy(self.view)
            view["units"][0].update(patch)
            with self.subTest(patch=patch), self.assertRaises(ValueError):
                validate_dashboard(view, self.catalog, min_units=1)
        view = copy.deepcopy(self.view)
        view["allyCode"] = "000000000"
        with self.assertRaises(ValueError):
            validate_dashboard(view, self.catalog, min_units=1)
        view = copy.deepcopy(self.view)
        view["units"].append(view["units"][0])
        with self.assertRaises(ValueError):
            validate_dashboard(view, self.catalog, min_units=1)

    def test_small_or_undated_roster_is_rejected(self):
        with self.assertRaises(ValueError):
            validate_dashboard(self.view, self.catalog)
        self.view["refreshedAt"] = ""
        with self.assertRaises(ValueError):
            validate_dashboard(self.view, self.catalog, min_units=1)


if __name__ == "__main__":
    unittest.main()
