package com.alliances.web;

import com.alliances.service.RequestService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Lists the frontend dropdowns and presets so they live in one place. */
@RestController
public class MetaController {
    @GetMapping("/api/meta")
    public Map<String, List<String>> meta() {
        return Map.of(
                "declineReasons", RequestService.REASONS,
                "departments", List.of("Computer Science / CSE", "Medical", "Pharmacy", "Agriculture", "MBA", "Other engineering", "Other"),
                "years", List.of("1st year", "2nd year", "3rd year", "4th year", "5th year", "Postgraduate"),
                "presetSkills", List.of("Java", "Python", "JavaScript", "React", "Spring Boot", "SQL", "Machine Learning", "Data Analysis",
                        "UI/UX Design", "Research Writing", "Clinical Knowledge", "Pharmacology", "Lab Work", "Agriculture",
                        "Business Strategy", "Marketing", "Public Speaking"));
    }
}
