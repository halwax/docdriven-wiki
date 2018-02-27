package org.docdriven.wiki.project;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProjectController {

	@Autowired
	private ProjectService projectService;

	@GetMapping("/api/projects")
	public @ResponseBody List<Project> getProjects() {
		return projectService.getProjects();
	}

}
