package org.docdriven.wiki.project;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.docdriven.wiki.WikiProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {

	@Autowired
	private WikiProperties wikiProperties;

	public List<Project> getProjects() {
		return wikiProperties.getProjects().stream().map(projectProperty -> {
			Project project = new Project();
			project.setName(projectProperty.getName());
			project.setPath(projectProperty.getPath());
			return project;
		}).collect(Collectors.toList());
	}

	public Optional<Project> getProject(String name) {
		return getProjects().stream().filter(project -> name.equalsIgnoreCase(project.getName())).findFirst();
	}

}
