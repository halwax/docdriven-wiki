package org.docdriven.wiki.home;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

	@GetMapping("/")
	public String home() {
		return "home";
	}

	@GetMapping("/projects/{projectName}")
	public String project() {
		return "project";
	}

	@GetMapping("/projects")
	public String projects() {
		return "projects";
	}

}
